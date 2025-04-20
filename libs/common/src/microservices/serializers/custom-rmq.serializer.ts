import { Serializer } from "@nestjs/microservices";

/**
 * Serializes messages for RabbitMQ ensuring they have the correct structure
 * expected by NestJS microservices.
 *
 * NestJS requires a 'pattern' field in RabbitMQ messages to properly route them
 * to the correct handlers.
 */
export class CustomRmqSerializer implements Serializer {
  /**
   * Serializes a packet into a properly structured RabbitMQ message
   * @param packet The message packet to serialize
   * @returns Buffer containing the serialized message
   */
  serialize(packet: any): Buffer {
    const { pattern, data } = packet;

    if (!pattern) {
      console.warn("[CustomRmqSerializer] Warning: Message without pattern");
    }

    return Buffer.from(
      JSON.stringify({
        pattern: pattern || "unknown",
        data,
      }),
    );
  }
}
