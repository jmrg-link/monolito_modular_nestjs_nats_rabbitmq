import { DynamicModule, Global, Module } from "@nestjs/common";
import { LoggerService } from "./logger.service";

/**
 * Módulo global de logging para la aplicación
 * @class
 */
@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {
  /**
   * Configuración estática del módulo
   * @returns {DynamicModule} Módulo configurado
   */
  static forRoot(): DynamicModule {
    return {
      module: LoggerModule,
      providers: [LoggerService],
      exports: [LoggerService],
    };
  }

  /**
   * Configuración dinámica del módulo según el entorno
   * @param {string} environment - Entorno de ejecución (development, production, test)
   * @returns {DynamicModule} Módulo configurado
   */
  static forRootAsync(environment: string): DynamicModule {
    LoggerService.setLogLevels(environment);

    return {
      module: LoggerModule,
      providers: [LoggerService],
      exports: [LoggerService],
    };
  }
}
