import { Inject, Injectable, OnModuleDestroy, Logger } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { ProductRepository } from "../infrastructure/Product.repository";
import { Product } from "../domain/Product.entity";
import {
  PaginatedResult,
  PaginationOptions,
} from "@libs/common/src/interfaces/pagination.interface";
import * as amqplib from "amqplib";

/**
 * Servicio de aplicación para productos
 */
@Injectable()
export class ProductService implements OnModuleDestroy {
  private connection: any = null;
  private channel: any = null;
  private readonly productExchange = "product_exchange";
  private readonly logger = new Logger(ProductService.name);

  /**
   * Constructor del servicio de productos
   * @param productRepository Repositorio para persistencia de productos
   * @param natsClient Cliente para mensajería NATS
   */
  constructor(
    private readonly productRepository: ProductRepository,
    @Inject("NATS_SERVICE") private readonly natsClient: ClientProxy,
  ) {
    // Iniciamos una conexión manual a RabbitMQ
    this.initRabbitMQConnection();
  }

  private async initRabbitMQConnection() {
    try {
      const rabbitmqUrl =
        process.env.RABBITMQ_URL ||
        "amqp://rabbit_user:rabbit_password@localhost:5672";
      this.connection = await amqplib.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Verificar que el exchange de productos exista
      await this.channel.assertExchange(this.productExchange, "topic", {
        durable: true,
      });

      this.logger.log(
        "Conexión manual a RabbitMQ establecida con éxito para productos",
      );

      // Manejar reconexiones
      this.connection.on("close", () => {
        this.logger.warn(
          "Conexión a RabbitMQ cerrada, intentando reconectar...",
        );
        setTimeout(() => this.initRabbitMQConnection(), 5000);
      });

      this.connection.on("error", (err: Error) => {
        this.logger.error(`Error en conexión RabbitMQ: ${err.message}`);
        this.closeConnection();
        setTimeout(() => this.initRabbitMQConnection(), 5000);
      });
    } catch (error) {
      this.logger.error(
        `Error al conectar con RabbitMQ: ${error instanceof Error ? error.message : String(error)}`,
      );
      setTimeout(() => this.initRabbitMQConnection(), 5000);
    }
  }

  private async closeConnection() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
    } catch (error) {
      this.logger.error(
        `Error al cerrar conexión RabbitMQ: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Método para publicar en RabbitMQ manualmente
  private async publishToRabbitMQ(routingKey: string, message: any) {
    if (!this.channel) {
      this.logger.warn("Intento de publicar en RabbitMQ sin conexión activa");
      return;
    }

    try {
      const success = this.channel.publish(
        this.productExchange,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          contentType: "application/json",
        },
      );

      if (success) {
        this.logger.debug(`Mensaje publicado en RabbitMQ: ${routingKey}`);
      } else {
        this.logger.warn(
          `No se pudo publicar mensaje en RabbitMQ: ${routingKey}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error al publicar en RabbitMQ: ${error instanceof Error ? error.message : String(error)}`,
      );

      // Si hay un error de conexión, intentamos reconectar
      if (!this.connection || !this.channel) {
        this.initRabbitMQConnection();
      }
    }
  }

  /**
   * Crea un nuevo producto
   * @param product Entidad de dominio Product
   * @param description Descripción opcional del producto
   * @returns Producto creado con sus datos e ID
   */
  async createProduct(product: Product, description?: string) {
    const productData = {
      ...product,
      description: description || "",
      isActive: true,
    };

    const created = await this.productRepository.save(productData as any);

    // Publicar evento en NATS
    this.natsClient.emit("product.created", {
      id: created._id,
      name: created.name,
      price: created.price,
      isActive: created.isActive,
      description: created.description,
    });

    // Publicar evento en RabbitMQ manualmente
    await this.publishToRabbitMQ("product.created", {
      id: created._id,
      name: created.name,
      price: created.price,
      isActive: created.isActive,
      description: created.description,
    });

    return created;
  }

  /**
   * Obtiene todos los productos con paginación opcional
   * @param options Opciones de paginación
   * @returns Lista paginada de productos
   */
  async findAll(
    options?: PaginationOptions,
  ): Promise<PaginatedResult<any> | any[]> {
    if (options) {
      return this.productRepository.findWithPagination(options);
    }
    return this.productRepository.findAll();
  }

  /**
   * Busca un producto por su ID
   * @param id Identificador único del producto
   * @returns Producto encontrado o null
   */
  async findById(id: string) {
    return this.productRepository.findById(id);
  }

  /**
   * Busca productos por nombre
   * @param term Término de búsqueda
   * @returns Array de productos que coinciden con el término
   */
  async searchByName(term: string) {
    return this.productRepository.searchByName(term);
  }

  /**
   * Busca productos por rango de precio
   * @param min Precio mínimo
   * @param max Precio máximo
   * @returns Array de productos dentro del rango de precio
   */
  async findByPriceRange(min: number, max: number) {
    return this.productRepository.findByPriceRange(min, max);
  }

  /**
   * Actualiza un producto existente
   * @param id Identificador único del producto
   * @param update Campos a actualizar
   * @returns Producto actualizado
   */
  async updateProduct(
    id: string,
    update: Partial<{
      name: string;
      price: number;
      isActive: boolean;
      description: string;
    }>,
  ) {
    const updated = await this.productRepository.update(id, update);

    // Publicar evento en NATS
    this.natsClient.emit("product.updated", { id, ...update });

    // Publicar evento en RabbitMQ manualmente
    await this.publishToRabbitMQ("product.updated", { id, ...update });

    return updated;
  }

  /**
   * Elimina un producto
   * @param id Identificador único del producto
   * @returns Resultado de la operación
   */
  async deleteProduct(id: string) {
    const deleted = await this.productRepository.delete(id);

    // Publicar evento en NATS
    this.natsClient.emit("product.deleted", { id });

    // Publicar evento en RabbitMQ manualmente
    await this.publishToRabbitMQ("product.deleted", { id });

    return deleted;
  }

  /**
   * Limpia recursos cuando el módulo se destruye
   */
  async onModuleDestroy() {
    await this.closeConnection();
  }
}
