import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ClientsModule } from "@nestjs/microservices";
import { HealthController } from "./health.controller";
import { AuthModule } from "./auth/auth.module";
import { CacheController, CacheService } from "./cache";
import { ApiGatewayConfig } from "./config/app.config";
import {
  LoggerModule,
  NatsCheckerService,
  natsConfig,
  rmqConfig,
} from "@libs/common";

/**
 * Módulo raíz de la aplicación API Gateway
 * Configura componentes de infraestructura e integra módulos funcionales
 * @class
 */
@Module({
  imports: [
    LoggerModule.forRootAsync(process.env.NODE_ENV || "development"),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === "production"
          ? ".env"
          : `.env.${process.env.NODE_ENV || "development"}`,
      cache: true,
    }),
    ClientsModule.register([
      {
        name: "NATS_SERVICE",
        ...natsConfig,
        options: {
          ...natsConfig.options,
          user: ApiGatewayConfig.messaging.nats.user,
          pass: ApiGatewayConfig.messaging.nats.pass,
        },
      },
      {
        name: "RABBITMQ_SERVICE",
        ...rmqConfig,
        options: {
          ...rmqConfig.options,
          exchange: "user_exchange", // Especificar explícitamente el exchange para emisiones
        },
      },
    ]),
    AuthModule,
  ],
  controllers: [HealthController, CacheController],
  providers: [
    CacheService,
    NatsCheckerService,
    {
      provide: "APP_CONFIG",
      useValue: ApiGatewayConfig,
    },
  ],
})
export class AppModule {}
