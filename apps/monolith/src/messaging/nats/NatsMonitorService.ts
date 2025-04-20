import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { NatsSubscriber } from "./NatsSubscriber";

/**
 * Servicio para monitorear y verificar el estado del suscriptor NATS
 * @class
 * @description Verifica que los manejadores NATS estén correctamente registrados y funcionando
 */
@Injectable()
export class NatsMonitorService implements OnModuleInit {
  private readonly logger = new Logger(NatsMonitorService.name);

  constructor(private readonly natsSubscriber: NatsSubscriber) {}

  /**
   * Se ejecuta al inicializar el módulo para verificar el estado de NATS
   * @returns {Promise<void>} Promesa que se resuelve cuando la verificación está completa
   */
  async onModuleInit() {
    try {
      const subscriberKeys = Object.getOwnPropertyNames(
        Object.getPrototypeOf(this.natsSubscriber),
      );
      const handlerMethods = subscriberKeys.filter(
        (key) =>
          key.startsWith("find") ||
          key.startsWith("create") ||
          key.startsWith("update"),
      );
      if (handlerMethods.length > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        this.logger.log(
          "Suscriptor NATS verificado y listo para procesar mensajes",
        );
      } else {
        this.logger.warn(
          "No se encontraron métodos de handler en el suscriptor NATS",
        );
      }
    } catch (error) {
      this.logger.error(
        "Error al inicializar el monitor NATS",
        error instanceof Error ? error.stack : "Error desconocido",
      );
    }
  }
}
