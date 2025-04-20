import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { LoggerService } from "../logger/logger.service";

/**
 * Servicio para verificar la conexión NATS al inicio de la aplicación
 * @class
 * @description Intenta establecer conexión con NATS y registra el resultado
 */
@Injectable()
export class NatsCheckerService implements OnModuleInit {
  private readonly logger: LoggerService;

  /**
   * Crea una instancia del servicio verificador de NATS
   * @param {ClientProxy} natsClient - Cliente NATS inyectado
   * @param {LoggerService} loggerService - Servicio de logging centralizado
   */
  constructor(
    @Inject("NATS_SERVICE") private readonly natsClient: ClientProxy,
    loggerService: LoggerService,
  ) {
    this.logger = loggerService.setContext("NatsChecker");
  }

  /**
   * Verifica la conexión con NATS al inicializarse el módulo
   * @returns {Promise<void>} Promesa que se resuelve cuando termina la verificación
   */
  async onModuleInit(): Promise<void> {
    try {
      this.logger.log("Verificando conexión NATS...");

      await this.natsClient.connect();

      this.logger.log("Conexión NATS establecida correctamente");

      // Esperar un momento para asegurar que la conexión está estable
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      this.logger.error(
        `Error al conectar con NATS: ${error instanceof Error ? error.message : "Error desconocido"}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
