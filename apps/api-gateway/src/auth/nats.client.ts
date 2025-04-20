import { Injectable, Logger } from "@nestjs/common";

/**
 * Cliente NATS personalizado para comunicación directa con microservicios.
 * Permite enviar mensajes de forma manual sin depender del sistema de decoradores de NestJS.
 */
@Injectable()
export class NatsDirectClient {
  private readonly logger = new Logger(NatsDirectClient.name);
  private natsConnection: any = null;

  /**
   * Inicializa la conexión con el servidor NATS
   * @param url Dirección del servidor NATS
   * @returns Promise<boolean> Indica si la conexión fue exitosa
   */
  async connect(url: string = "nats://localhost:4222"): Promise<boolean> {
    try {
      const { connect } = require("nats");
      this.natsConnection = await connect({ servers: url });
      this.logger.log("Conexión NATS directa establecida");
      return true;
    } catch (error) {
      this.logger.error(
        `Error al conectar con NATS: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
      return false;
    }
  }

  /**
   * Envía una solicitud directa al servicio NATS y espera una respuesta
   * @param subject Tema al que se enviará la solicitud
   * @param data Datos a enviar
   * @param timeout Tiempo máximo de espera para la respuesta (ms)
   * @returns Promise<any> Respuesta recibida o null si hay error
   */
  async request(
    subject: string,
    data: any,
    timeout: number = 5000,
  ): Promise<any> {
    if (!this.natsConnection) {
      await this.connect();
    }

    try {
      this.logger.log(`Enviando solicitud directa a NATS: ${subject}`);
      const response = await this.natsConnection.request(
        subject,
        JSON.stringify(data),
        { timeout },
      );

      const responseData = JSON.parse(new TextDecoder().decode(response.data));
      this.logger.log(`Respuesta recibida para ${subject}`);
      return responseData;
    } catch (error) {
      this.logger.error(
        `Error en solicitud NATS a ${subject}: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
      return null;
    }
  }

  /**
   * Publica un evento en NATS sin esperar respuesta
   * @param subject Tema al que se publicará el evento
   * @param data Datos a publicar
   * @returns Promise<boolean> Indica si la publicación fue exitosa
   */
  async publish(subject: string, data: any): Promise<boolean> {
    if (!this.natsConnection) {
      await this.connect();
    }

    try {
      this.logger.log(`Publicando evento en NATS: ${subject}`);
      this.natsConnection.publish(subject, JSON.stringify(data));
      return true;
    } catch (error) {
      this.logger.error(
        `Error al publicar evento NATS en ${subject}: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
      return false;
    }
  }

  /**
   * Cierra la conexión con NATS
   */
  async close(): Promise<void> {
    if (this.natsConnection) {
      await this.natsConnection.drain();
      this.natsConnection = null;
      this.logger.log("Conexión NATS cerrada");
    }
  }
}
