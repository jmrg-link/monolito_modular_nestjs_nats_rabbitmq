/**
 * Módulo de autenticación común
 * @module Common/Auth
 */
import { Module, DynamicModule } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { JwtStrategy } from "./jwt.strategy";

/**
 * Opciones para la configuración de autenticación
 * @interface AuthModuleOptions
 */
export interface AuthModuleOptions {
  /** Secreto para firmar JWT */
  jwtSecret: string;
  /** Tiempo de expiración del token en segundos */
  jwtExpiresIn?: number;
}

/**
 * Módulo para configuración de autenticación
 * @class AuthModule
 */
@Module({})
export class AuthModule {
  /**
   * Registra el módulo de autenticación con configuración
   * @param options - Opciones de configuración
   * @returns Módulo dinámico configurado
   */
  static forRoot(options: AuthModuleOptions): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        PassportModule.register({ defaultStrategy: "jwt" }),
        JwtModule.register({
          secret: options.jwtSecret,
          signOptions: {
            expiresIn: options.jwtExpiresIn ? `${options.jwtExpiresIn}s` : "1h",
          },
        }),
      ],
      providers: [
        {
          provide: JwtStrategy,
          useFactory: () => new JwtStrategy(options.jwtSecret),
        },
      ],
      exports: [PassportModule, JwtModule, JwtStrategy],
    };
  }
}
