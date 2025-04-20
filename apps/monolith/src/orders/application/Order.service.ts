import {
  Inject,
  Injectable,
  NotFoundException,
  Logger,
  OnModuleDestroy,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { OrderRepository } from "../infrastructure/Order.repository";
import { Order } from "../domain/Order.entity";
import {
  PaginatedResult,
  PaginationOptions,
} from "@libs/common/src/interfaces/pagination.interface";
import * as amqplib from "amqplib";

@Injectable()
export class OrderService implements OnModuleDestroy {
  private connection: any = null;
  private channel: any = null;
  private readonly orderExchange = "order_exchange";
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
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

      // Verificar que el exchange de órdenes exista
      await this.channel.assertExchange(this.orderExchange, "topic", {
        durable: true,
      });

      this.logger.log("Conexión manual a RabbitMQ establecida con éxito");

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
        this.orderExchange,
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

  async createOrder(order: Order, products?: string[]) {
    const orderData = {
      ...order,
      products: products || [],
      status: "pending",
    };

    const created = await this.orderRepository.save(orderData as any);

    // Publicar evento en NATS
    this.natsClient.emit("order.created", {
      id: created._id,
      userId: created.userId,
      total: created.total,
      status: created.status,
      products: created.products,
    });

    // Publicar evento en RabbitMQ manualmente
    await this.publishToRabbitMQ("order.created", {
      id: created._id,
      userId: created.userId,
      total: created.total,
      status: created.status,
      products: created.products,
    });

    return created;
  }

  async findAll(
    options?: PaginationOptions,
  ): Promise<PaginatedResult<any> | any[]> {
    if (options) {
      return this.orderRepository.findWithPagination(options);
    }
    return this.orderRepository.findAll();
  }

  async findById(id: string) {
    return this.orderRepository.findById(id);
  }

  async findByUserId(userId: string) {
    return this.orderRepository.findByUserId(userId);
  }

  async updateOrder(
    id: string,
    update: Partial<{
      userId: string;
      total: number;
      products: string[];
      status: string;
      paidAt: Date;
    }>,
  ) {
    const updated = await this.orderRepository.update(id, update);

    // Publicar evento en NATS
    this.natsClient.emit("order.updated", { id, ...update });

    // Publicar evento en RabbitMQ manualmente
    await this.publishToRabbitMQ("order.updated", { id, ...update });

    return updated;
  }

  async deleteOrder(id: string) {
    const deleted = await this.orderRepository.delete(id);

    // Publicar evento en NATS
    this.natsClient.emit("order.deleted", { id });

    // Publicar evento en RabbitMQ manualmente
    await this.publishToRabbitMQ("order.deleted", { id });

    return deleted;
  }

  async markOrderAsPaid(id: string) {
    const updated = await this.orderRepository.update(id, {
      status: "processing",
      paidAt: new Date(),
    });

    if (!updated) {
      throw new NotFoundException(`Orden con ID ${id} no encontrada`);
    }

    const eventData = {
      id,
      status: "processing",
      paidAt: updated.paidAt,
    };

    // Publicar evento en NATS
    this.natsClient.emit("order.paid", eventData);

    // Publicar evento en RabbitMQ manualmente
    await this.publishToRabbitMQ("order.paid", eventData);

    return {
      id: updated.id,
      status: updated.status,
      paidAt: updated.paidAt,
      message: "Orden marcada como pagada correctamente",
    };
  }

  // Cerrar conexiones cuando el servicio se destruye
  async onModuleDestroy() {
    await this.closeConnection();
  }
}
