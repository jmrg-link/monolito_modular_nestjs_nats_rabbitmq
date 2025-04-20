import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import * as amqplib from "amqplib";
import { Subject, filter, debounceTime, distinctUntilKeyChanged } from "rxjs";

/**
 * Interceptor de mensajes RabbitMQ que captura mensajes durante el inicio del sistema
 * y los republica cuando todos los manejadores estén correctamente inicializados.
 *
 * @remarks
 * Utiliza RxJS para deduplicar mensajes y evitar procesamiento múltiple del mismo evento.
 */
@Injectable()
export class RmqMessageTrap implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger("RmqMessageTrap");
  private connection: any = null;
  private channel: any = null;
  private trapQueue = "message_trap_queue";
  private originalExchange = "user_exchange";
  private isReady = false;
  private consumerTag: string | null = null;
  private processedMessages = new Set<string>();
  private messageSubject = new Subject<{
    messageId: string;
    routingKey: string;
    message: amqplib.ConsumeMessage;
  }>();
  private readonly STARTUP_DELAY = 15000;
  private readonly MAX_PROCESSING_TIME = 60000;

  /**
   * Inicializa la conexión a RabbitMQ y configura la cola de captura de mensajes.
   *
   * @returns {Promise<void>} Promesa que se resuelve cuando la inicialización está completa
   * @throws {Error} Si no se puede establecer la conexión o crear el canal
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log("Iniciando interceptor de mensajes...");

      const connectionUrl =
        process.env.RABBITMQ_URL ||
        "amqp://rabbit_user:rabbit_password@localhost:5672";
      this.connection = await amqplib.connect(connectionUrl);

      if (!this.connection) {
        throw new Error("Failed to establish RabbitMQ connection");
      }

      this.channel = await this.connection.createChannel();

      if (!this.channel) {
        throw new Error("Failed to create RabbitMQ channel");
      }

      await this.channel.assertQueue(this.trapQueue, {
        durable: true,
        arguments: {
          "x-message-ttl": 300000,
          "x-expires": 600000,
          "x-dead-letter-exchange": "",
          "x-dead-letter-routing-key": "dead_letter_queue",
        },
      });

      await this.channel.assertQueue("dead_letter_queue", { durable: true });

      await this.channel.bindQueue(
        this.trapQueue,
        this.originalExchange,
        "user.loggedIn",
      );

      this.logger.log(
        `Cola ${this.trapQueue} configurada para interceptar mensajes`,
      );

      // Configurar el observable para procesar mensajes con deduplicación
      this.setupMessageProcessing();

      this.logger.log(
        `Esperando ${this.STARTUP_DELAY / 1000} segundos antes de procesar mensajes...`,
      );
      setTimeout(() => this.startProcessing(), this.STARTUP_DELAY);
    } catch (error) {
      this.logger.error(
        `Error al configurar interceptor de mensajes: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Configura el procesamiento de mensajes utilizando observables RxJS para deduplicación.
   *
   * @private
   */
  private setupMessageProcessing(): void {
    // Crear pipeline de procesamiento con RxJS
    this.messageSubject
      .pipe(
        // Descartar mensajes duplicados basados en messageId
        filter((data) => !this.processedMessages.has(data.messageId)),
        // Asegurar que solo procesamos un mensaje con la misma clave en un período de tiempo
        distinctUntilKeyChanged("messageId"),
        // Esperar un pequeño periodo para asegurar que no hay duplicados en camino
        debounceTime(100),
      )
      .subscribe((data) => {
        this.processMessage(data.messageId, data.routingKey, data.message);
      });
  }

  /**
   * Procesa un mensaje individual y lo republica.
   *
   * @param {string} messageId - Identificador único del mensaje
   * @param {string} routingKey - Clave de enrutamiento
   * @param {amqplib.ConsumeMessage} msg - Mensaje original de RabbitMQ
   * @private
   */
  private async processMessage(
    messageId: string,
    routingKey: string,
    msg: amqplib.ConsumeMessage,
  ): Promise<void> {
    try {
      // Marcar como procesado para evitar duplicados
      this.processedMessages.add(messageId);

      this.logger.log(
        `Procesando mensaje interceptado: ${routingKey} [${messageId}]`,
      );

      if (!this.channel) {
        throw new Error("Channel is not available");
      }

      const headers = msg.properties.headers || {};

      // Si ya fue republicado, solo confirmar y no volver a publicar
      if (headers["x-republished"]) {
        this.logger.log(
          `Ignorando mensaje ya republicado para evitar bucles: ${routingKey} [${messageId}]`,
        );
        this.channel.ack(msg);
        return;
      }

      const newHeaders = { ...headers };
      newHeaders["x-republished"] = "true";
      newHeaders["x-original-timestamp"] = new Date().toISOString();

      const success = this.channel.publish(
        msg.fields.exchange || this.originalExchange,
        routingKey,
        msg.content,
        {
          persistent: true,
          headers: newHeaders,
          messageId: messageId,
          timestamp: Date.now(),
        },
      );

      if (success) {
        this.logger.log(`Mensaje ${messageId} republicado exitosamente`);
        this.channel.ack(msg);
      } else {
        this.logger.warn(`No se pudo publicar el mensaje ${messageId}`);
        this.channel.nack(msg, false, true);
      }
    } catch (error) {
      this.logger.error(
        `Error al procesar mensaje: ${error instanceof Error ? error.message : String(error)}`,
      );
      if (this.channel) {
        this.channel.nack(msg, false, true);
      }
    }
  }

  /**
   * Comienza a procesar los mensajes capturados utilizando RxJS para deduplicación.
   *
   * @private
   * @returns {Promise<void>} Promesa que se resuelve cuando el procesamiento inicia correctamente
   */
  private async startProcessing(): Promise<void> {
    if (!this.channel) return;

    try {
      this.isReady = true;
      this.logger.log("Comenzando a procesar mensajes interceptados...");

      const { consumerTag } = await this.channel.consume(
        this.trapQueue,
        (msg: amqplib.ConsumeMessage | null) => {
          if (!msg) return;

          // Obtener un ID único para el mensaje para seguimiento
          const messageId =
            msg.properties.messageId ||
            Buffer.from(msg.content).toString("hex").substring(0, 8);

          // Enviar al subject para procesamiento deduplicado
          this.messageSubject.next({
            messageId,
            routingKey: msg.fields.routingKey,
            message: msg,
          });
        },
        { noAck: false },
      );

      this.consumerTag = consumerTag;

      setTimeout(() => this.stopProcessing(), this.MAX_PROCESSING_TIME);
    } catch (error) {
      this.logger.error(
        `Error al consumir mensajes: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Detiene la interceptación de mensajes, elimina los bindings y purga la cola.
   *
   * @private
   * @returns {Promise<void>} Promesa que se resuelve cuando la interceptación se ha detenido
   */
  private async stopProcessing(): Promise<void> {
    if (!this.channel || !this.consumerTag) return;

    try {
      this.logger.log("Deteniendo interceptación de mensajes...");

      // Completar el subject de mensajes
      this.messageSubject.complete();

      await this.channel.cancel(this.consumerTag);
      this.logger.log("Consumidor detenido");

      await this.channel.unbindQueue(
        this.trapQueue,
        this.originalExchange,
        "user.loggedIn",
      );

      this.logger.log("Bindings de cola eliminados");

      await this.channel.purgeQueue(this.trapQueue);
      this.logger.log("Cola purgada, interceptación finalizada");
    } catch (error) {
      this.logger.error(
        `Error al detener interceptación: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Limpia los recursos cuando la aplicación se está cerrando.
   *
   * @returns {Promise<void>} Promesa que se resuelve cuando los recursos se han liberado
   */
  async onModuleDestroy(): Promise<void> {
    try {
      // Completar el subject si aún está activo
      if (!this.messageSubject.closed) {
        this.messageSubject.complete();
      }

      if (this.consumerTag && this.channel) {
        await this.channel.cancel(this.consumerTag);
      }

      if (this.channel) {
        await this.channel.close();
      }

      if (this.connection) {
        await this.connection.close();
      }

      this.logger.log("Recursos de RmqMessageTrap liberados correctamente");
    } catch (error) {
      this.logger.error(
        `Error al cerrar conexiones: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
