import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { rabbitMqConfig } from "./rabbitmq.config";
import { UserService } from "../../users/application/User.service";
import { User } from "../../users/domain/User.entity";

const amqplib = require("amqplib");

/**
 * Consumidor manual de RabbitMQ
 * @class
 * @description Gestiona las conexiones y consumo de mensajes de colas RabbitMQ
 */
@Injectable()
export class RabbitMQConsumer implements OnModuleInit {
  private connection: any = null;
  private channel: any = null;
  private readonly logger = new Logger(RabbitMQConsumer.name);

  constructor(private readonly userService: UserService) {}

  /**
   * Inicializa la conexión y configura los consumidores cuando el módulo se inicia
   * @returns {Promise<void>} Promesa que se resuelve cuando la configuración está completa
   */
  async onModuleInit() {
    try {
      this.logger.log("Iniciando consumidor manual de RabbitMQ...");

      await new Promise((resolve) => setTimeout(resolve, 1000));
      await this.connect();
      if (this.channel) {
        await this.channel.assertQueue(
          rabbitMqConfig.queues.user.name,
          rabbitMqConfig.queues.user.options,
        );

        this.logger.log(
          `Configurando consumidor para cola ${rabbitMqConfig.queues.user.name}`,
        );

        try {
          const dlqName = rabbitMqConfig.queues.dlq.name;
          this.logger.log(`Asegurando que la cola DLQ ${dlqName} existe`);
          await this.channel.assertQueue(
            dlqName,
            rabbitMqConfig.queues.dlq.options,
          );

          const dlxName = rabbitMqConfig.exchanges.dlx.name;
          await this.channel.assertExchange(dlxName, "topic", {
            durable: true,
          });
          await this.channel.bindQueue(dlqName, dlxName, "dead.#");

          this.logger.log(`Configuración DLQ completada correctamente`);
        } catch (dlqError) {
          this.logger.warn(
            `No se pudo configurar la cola DLQ: ${dlqError instanceof Error ? dlqError.message : String(dlqError)}`,
          );
        }

        await this.channel.consume(
          rabbitMqConfig.queues.user.name,
          async (msg: any) => {
            if (!msg) return;
            try {
              const content = msg.content.toString();
              const routingKey = msg.fields.routingKey;
              const rawData = JSON.parse(content);
              const hasNestJSFormat =
                rawData &&
                typeof rawData === "object" &&
                "pattern" in rawData &&
                "data" in rawData;

              const data = hasNestJSFormat ? rawData.data : rawData;
              const pattern = hasNestJSFormat ? rawData.pattern : routingKey;
              this.logger.log(
                `Mensaje recibido en ${rabbitMqConfig.queues.user.name}: ${routingKey}, Pattern: ${pattern}`,
              );
              if (
                pattern === "user.registered" ||
                routingKey === "user.registered"
              ) {
                this.logger.log(
                  `Procesando evento de registro de usuario: ${data.email}`,
                );

                try {
                  const existingUser = await this.userService.findByEmail(
                    data.email,
                  );

                  if (!existingUser) {
                    const user = new User(
                      undefined as unknown as string,
                      data.email,
                      data.name,
                      data.roles || ["user"],
                    );

                    const bcrypt = require("bcrypt");
                    const tempPasswordHash = await bcrypt.hash(
                      "temp-" + Date.now(),
                      10,
                    );

                    await this.userService.createUser(
                      user,
                      "",
                      tempPasswordHash,
                    );

                    this.logger.log(`Usuario creado: ${data.email}`);
                  }
                } catch (error) {
                  this.logger.error(
                    `Error procesando evento de registro de RabbitMQ: ${error instanceof Error ? error.message : "Error desconocido"}`,
                    error instanceof Error ? error.stack : undefined,
                  );
                }

                this.channel?.ack(msg);
              } else if (
                pattern === "user.loggedIn" ||
                routingKey === "user.loggedIn"
              ) {
                try {
                  if (data && data.id) {
                    const timestamp = data.timestamp
                      ? new Date(data.timestamp)
                      : new Date();
                    await this.userService.updateLastLoginTimestamp(
                      data.id,
                      timestamp,
                    );
                  }
                } catch (error) {
                  this.logger.error(
                    `Error al procesar evento de login: ${error instanceof Error ? error.message : "Error desconocido"}`,
                  );
                }
                this.channel?.ack(msg);
              } else {
                this.channel?.ack(msg);
              }
            } catch (error) {
              this.logger.error(
                `Error procesando mensaje: ${error instanceof Error ? error.message : String(error)}`,
              );
              this.channel?.nack(msg, false, false);
            }
          },
          { noAck: false },
        );

        this.logger.log("Consumidor de RabbitMQ configurado correctamente");
      }
    } catch (error) {
      this.logger.error(
        `Error inicializando consumidor RabbitMQ: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Establece la conexión con RabbitMQ
   * @returns {Promise<void>} Promesa que se resuelve cuando la conexión está establecida
   * @private
   */
  private async connect() {
    try {
      this.connection = await amqplib.connect(rabbitMqConfig.url);
      if (this.connection) {
        this.channel = await this.connection.createChannel();
        this.connection.on("close", () => {
          this.logger.warn(
            "Conexión RabbitMQ cerrada, intentando reconectar...",
          );
          setTimeout(() => this.connect(), 5000);
        });

        this.connection.on("error", (err: Error) => {
          this.logger.error(`Error en conexión RabbitMQ: ${err.message}`);
          this.closeConnection();
          setTimeout(() => this.connect(), 5000);
        });

        this.logger.log("Conexión RabbitMQ establecida con éxito");
      }
    } catch (error) {
      this.logger.error(
        `Error conectando a RabbitMQ: ${error instanceof Error ? error.message : String(error)}`,
      );
      setTimeout(() => this.connect(), 5000);
    }
  }

  /**
   * Cierra la conexión limpiamente
   * @private
   */
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
        `Error cerrando conexión RabbitMQ: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
