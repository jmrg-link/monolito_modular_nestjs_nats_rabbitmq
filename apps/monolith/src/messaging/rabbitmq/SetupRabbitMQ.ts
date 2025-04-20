import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { setupRabbitMQInfrastructure } from "./rabbitmq.util";

/**
 * Servicio para configurar la infraestructura RabbitMQ al inicio de la aplicación.
 * Asegura que todas las colas, exchanges y bindings necesarios estén correctamente configurados.
 */
@Injectable()
export class RabbitMQSetupService implements OnModuleInit {
  private readonly logger = new Logger(RabbitMQSetupService.name);

  /**
   * Se ejecuta automáticamente cuando el módulo se inicializa.
   * Configura la infraestructura RabbitMQ requerida.
   */
  async onModuleInit() {
    try {
      this.logger.log("Configurando infraestructura RabbitMQ...");
      const result = await setupRabbitMQInfrastructure();
      if (result) {
        this.logger.log("Infraestructura RabbitMQ configurada correctamente.");
      } else {
        this.logger.warn(
          "Hubo problemas al configurar la infraestructura RabbitMQ.",
        );
      }
    } catch (error) {
      this.logger.error(
        `Error al configurar infraestructura RabbitMQ: ${error instanceof Error ? error.message : "Error desconocido"}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
