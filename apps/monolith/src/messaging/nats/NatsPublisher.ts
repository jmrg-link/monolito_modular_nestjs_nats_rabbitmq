import { Injectable } from "@nestjs/common";
import { ClientNats } from "@nestjs/microservices";

/**
 * Publisher de eventos a NATS.
 * Ejemplo de publicación de evento de usuario creado.
 */
@Injectable()
export class NatsPublisher {
  constructor(private readonly natsClient: ClientNats) {}

  /**
   * Publica un evento 'user.created' en NATS.
   * @param payload Cuerpo del mensaje.
   */
  async publishUserCreated(payload: any): Promise<void> {
    this.natsClient.emit("user.created", payload);
  }
}
