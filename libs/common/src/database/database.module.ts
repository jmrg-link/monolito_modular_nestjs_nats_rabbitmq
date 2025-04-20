/**
 * Módulo de configuración para MongoDB
 * @module Common/Database
 */
import { Module, DynamicModule } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";

/**
 * Opciones para la configuración de la base de datos
 * @interface DatabaseOptions
 */
export interface DatabaseOptions {
  /** URI de conexión a MongoDB */
  uri: string;
  /** Nombre de la base de datos */
  dbName?: string;
  /** Usuario para autenticación */
  user?: string;
  /** Contraseña para autenticación */
  password?: string;
  /** Host de MongoDB (cuando no se usa uri completa) */
  host?: string;
  /** Puerto de MongoDB (cuando no se usa uri completa) */
  port?: number;
  /** Opciones adicionales para la conexión */
  options?: Record<string, any>;
}

/**
 * Módulo para manejar las conexiones a MongoDB
 * @class DatabaseModule
 */
@Module({})
export class DatabaseModule {
  /**
   * Registra el módulo de base de datos con configuración
   * @param options - Opciones de configuración de la BD
   * @returns Módulo dinámico configurado
   */
  static forRoot(options: DatabaseOptions): DynamicModule {
    let uri = options.uri;
    if (!uri && options.host) {
      const auth =
        options.user && options.password
          ? `${options.user}:${options.password}@`
          : "";
      const port = options.port || 27017;
      const db = options.dbName || "test";
      uri = `mongodb://${auth}${options.host}:${port}/${db}`;

      if (options.options) {
        const query = Object.entries(options.options)
          .map(([key, value]) => `${key}=${value}`)
          .join("&");

        if (query) {
          uri += `?${query}`;
        }
      }
    }

    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRoot(uri, {
          ...options.options,
        }),
      ],
      exports: [MongooseModule],
    };
  }

  /**
   * Registra el módulo para ser usado en módulos de características
   * @returns Módulo dinámico para características
   */
  static forFeature(): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [],
      exports: [MongooseModule],
    };
  }
}
