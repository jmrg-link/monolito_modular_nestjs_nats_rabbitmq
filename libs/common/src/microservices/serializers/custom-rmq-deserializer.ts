import { Deserializer } from "@nestjs/microservices";
import { Logger } from "@nestjs/common";

/**
 * Deserializador personalizado para mensajes RabbitMQ que garantiza
 * el formato correcto esperado por NestJS.
 */
export class CustomRmqDeserializer implements Deserializer {
  private readonly logger = new Logger("RmqDeserializer");

  /**
   * Deserializa un mensaje de RabbitMQ al formato que NestJS espera.
   *
   * @param message - Mensaje original de RabbitMQ
   * @returns Objeto con estructura {pattern, data}
   */
  deserialize(message: any): any {
    try {
      // Manejar mensajes con formato incorrecto o nulo
      if (!message) {
        this.logger.warn("Mensaje nulo o indefinido recibido");
        return { pattern: "unknown", data: {} };
      }

      // Verificar si message.content existe
      if (!message.content) {
        // Si el mensaje ya es un objeto válido, usarlo directamente
        if (typeof message === "object") {
          // Si ya tiene la estructura esperada
          if (
            message.pattern ||
            (message.fields && message.fields.routingKey)
          ) {
            const pattern = message.pattern || message.fields.routingKey;
            const data = message.data || message;
            return { pattern, data };
          }

          // Si el mensaje ya está en formato JSON
          if (message.toString && typeof message.toString === "function") {
            try {
              const parsed = JSON.parse(message.toString());
              const pattern = parsed.pattern || "unknown";
              const data = parsed.data || parsed;
              return { pattern, data };
            } catch (e: unknown) {
              return { pattern: "unknown", data: message };
            }
          }
        }

        this.logger.warn("Mensaje sin propiedad content recibido");
        return { pattern: "unknown", data: message };
      }

      // Procesar mensaje con content normalmente
      const content = message.content.toString();
      let parsed;

      try {
        parsed = JSON.parse(content);
      } catch (parseError: unknown) {
        this.logger.warn(
          `Error al parsear JSON: ${parseError instanceof Error ? parseError.message : "Error desconocido"}`,
        );
        return {
          pattern: message.fields?.routingKey || "unknown",
          data: content,
        };
      }

      // Determinar el patrón y los datos
      const pattern =
        parsed?.pattern || message.fields?.routingKey || "unknown";
      const data = parsed?.data || parsed;

      return { pattern, data };
    } catch (error) {
      this.logger.error(
        `Error deserializando mensaje: ${error instanceof Error ? error.message : String(error)}`,
      );

      // En caso de error, devolver un objeto válido para evitar que la aplicación falle
      return {
        pattern: "error",
        data: { error: "Error al deserializar mensaje" },
      };
    }
  }
}
