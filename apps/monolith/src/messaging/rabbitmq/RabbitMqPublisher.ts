import { Injectable } from "@nestjs/common";
import { AmqpConnection } from "@golevelup/nestjs-rabbitmq";

/**
 * Publisher de eventos a RabbitMQ.
 */
@Injectable()
export class RabbitMqPublisher {
  constructor(private readonly amqp: AmqpConnection) {}

  /**
   * Publica un evento en el exchange 'order.events'.
   * @param routingKey Clave de enrutamiento.
   * @param payload Cuerpo del mensaje.
   */
  async publishOrderEvent(routingKey: string, payload: any): Promise<void> {
    await this.amqp.publish("order.events", routingKey, payload);
  }
}
