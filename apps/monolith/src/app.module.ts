import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";

import { UsersModule } from "./users/users.module";
import { OrdersModule } from "./orders/orders.module";
import { ProductsModule } from "./products/products.module";
import { MessagingModule } from "./messaging/messaging.module";
import { PublicUserController } from "./users/public-user.controller";
import { AuthModule, DatabaseModule, LoggerModule } from "@libs/common";
import { MonolithConfig } from "./config/app.config";

/**
 * Módulo principal de la aplicación monolítica
 * Organiza módulos de dominio, infraestructura y mensajería
 * @module Monolith/App
 */
@Module({
  imports: [
    LoggerModule.forRootAsync(process.env.NODE_ENV || "development"),
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: false,
      envFilePath: [".env.localhost", ".env.development", ".env"],
    }),

    DatabaseModule.forRoot({
      uri:
        process.env.NODE_ENV === "localhost"
          ? "mongodb://app_user:app_password@localhost:27017/app?authSource=app"
          : MonolithConfig.database.uri,
      options: {
        autoIndex: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      },
    }),

    AuthModule.forRoot({
      jwtSecret: MonolithConfig.jwt.secret,
      jwtExpiresIn: MonolithConfig.jwt.expiresIn,
    }),

    ClientsModule.register([
      {
        name: "NATS_SERVICE",
        transport: Transport.NATS,
        options: {
          servers: [MonolithConfig.messaging.nats.url],
        },
      },
    ]),

    UsersModule,
    OrdersModule,
    ProductsModule,
    MessagingModule,
  ],
  controllers: [PublicUserController],
})
export class AppModule {}
