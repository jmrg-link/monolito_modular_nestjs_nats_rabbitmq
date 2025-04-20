/**
 * Módulo de configuración para gestionar variables de entorno
 * @module Common/Config
 */
import { Module, DynamicModule } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { getEnvFileName } from "./envs";

/**
 * Módulo para configurar variables de entorno
 * @class ConfigModule
 */
@Module({})
export class ConfigModule {
  /**
   * Registra el módulo con configuración específica para cada aplicación
   * @param envFilePath - Rutas adicionales para archivos .env
   * @returns Módulo dinámico configurado
   */
  static forRoot(envFilePath: string[] = []): DynamicModule {
    const defaultEnvFile = getEnvFileName();

    return {
      module: ConfigModule,
      imports: [
        NestConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [defaultEnvFile, ...envFilePath],
        }),
      ],
      exports: [NestConfigModule],
    };
  }
}
