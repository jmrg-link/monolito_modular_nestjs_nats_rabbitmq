import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";

/**
 * Controlador de comprobación de salud del sistema
 * Proporciona endpoints para monitoreo de infraestructura y balanceadores de carga
 * @class
 */
@Controller("health")
export class HealthController {
  /**
   * Constructor del controlador de salud
   * @param {ClientProxy} natsClient - Cliente proxy para comunicación con NATS
   */
  constructor(
    @Inject("NATS_SERVICE") private readonly natsClient: ClientProxy,
  ) {}

  /**
   * Realiza una comprobación básica de salud del servicio API Gateway
   * @returns {Object} Información de estado del servicio con timestamp
   */
  @Get()
  check() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verifica la conexión con el servicio NATS
   * @returns {Object} Estado de la conexión NATS
   * @throws {ServiceUnavailableException} Si la conexión falla
   */
  @Get("nats")
  async checkNats() {
    try {
      this.natsClient.connect();

      return {
        status: "ok",
        message: "Conexión NATS funcionando correctamente",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new ServiceUnavailableException(
        "Error en la conexión con el servicio NATS",
      );
    }
  }
}
