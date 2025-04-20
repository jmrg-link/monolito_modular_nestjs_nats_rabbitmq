import { Injectable, Logger } from "@nestjs/common";

/**
 * Buffer para mensajes con reintento automático
 * Almacena temporalmente los mensajes que no pueden enviarse inmediatamente
 * e intenta reenviarlos después de un tiempo
 */
@Injectable()
export class MessageRetryBuffer {
  private buffer: Array<{
    exchange: string;
    routingKey: string;
    message: any;
    timestamp: number;
    retries: number;
  }> = [];
  private isProcessing = false;
  private readonly logger = new Logger("MessageRetryBuffer");
  private readonly maxRetries = 5;
  private readonly retryIntervals = [1000, 2000, 5000, 10000, 30000]; // Intervalos incrementales

  /**
   * Añade un mensaje al buffer para reintento
   */
  addMessage(exchange: string, routingKey: string, message: any): void {
    this.logger.log(`Mensaje añadido al buffer: ${routingKey}`);
    this.buffer.push({
      exchange,
      routingKey,
      message,
      timestamp: Date.now(),
      retries: 0,
    });

    if (!this.isProcessing) {
      this.processBuffer();
    }
  }

  /**
   * Procesa los mensajes en el buffer
   */
  private async processBuffer(): Promise<void> {
    if (this.buffer.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.logger.log(`Procesando buffer con ${this.buffer.length} mensajes`);

    try {
      // Esperar a que el sistema esté completamente iniciado
      await new Promise((resolve) => setTimeout(resolve, 3000));

      while (this.buffer.length > 0) {
        const item = this.buffer[0];
        const { exchange, routingKey, message, retries } = item;

        try {
          await this.publishMessage(exchange, routingKey, message);
          this.logger.log(`Mensaje reenviado exitosamente: ${routingKey}`);
          this.buffer.shift(); // Eliminar el mensaje procesado
        } catch (error) {
          if (retries >= this.maxRetries) {
            this.logger.error(
              `Mensaje descartado después de ${retries} intentos: ${routingKey}`,
            );
            this.buffer.shift(); // Eliminar después de alcanzar el máximo de reintentos
          } else {
            item.retries++;
            // Mover al final de la cola para procesar otros mensajes mientras tanto
            this.buffer.shift();
            this.buffer.push(item);

            // Esperar antes de reintentar
            const delay =
              this.retryIntervals[
                Math.min(retries, this.retryIntervals.length - 1)
              ];
            this.logger.log(
              `Reintentando mensaje ${routingKey} en ${delay}ms (intento ${retries + 1})`,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Publica un mensaje en RabbitMQ
   */
  private async publishMessage(
    exchange: string,
    routingKey: string,
    message: any,
  ): Promise<void> {
    try {
      const amqplib = require("amqplib");
      const connection = await amqplib.connect(
        process.env.RABBITMQ_URL ||
          "amqp://rabbit_user:rabbit_password@localhost:5672",
      );
      const channel = await connection.createChannel();

      // Añadir el formato esperado por NestJS si no está presente
      let messageContent = message;
      if (!message.pattern) {
        messageContent = {
          pattern: routingKey,
          data: message,
        };
      }

      const result = channel.publish(
        exchange,
        routingKey,
        Buffer.from(JSON.stringify(messageContent)),
        { persistent: true },
      );

      await channel.close();
      await connection.close();

      if (!result) {
        throw new Error("Publicación fallida");
      }
    } catch (error) {
      this.logger.error(
        `Error publicando mensaje: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
