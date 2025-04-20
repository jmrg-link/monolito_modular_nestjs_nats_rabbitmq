import { Controller, Get } from "@nestjs/common";
import { ApiHealth } from "@libs/common/src/decorators";

/**
 * Controlador para verificar el estado del servicio.
 * Proporciona endpoints para monitoreo y diagnóstico.
 */
@Controller("health")
export class HealthController {
  /**
   * Verifica el estado actual del servicio.
   * @returns {Object} Información de estado del servicio
   */
  @Get()
  @ApiHealth()
  check() {
    return {
      estado: "ok",
      servicio: "monolito",
      memoria: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
