import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ClientsModule, Transport } from "@nestjs/microservices";
import {
  CustomRmqSerializer,
  CustomRmqDeserializer,
} from "@libs/common/src/microservices/serializers";
import { MessageRetryBuffer } from "@libs/common/src/microservices";
import { AuthController } from "./Auth.controller";
import { AuthService } from "./Auth.service";
import { NatsDirectClient } from "./nats.client";
import { ApiGatewayConfig } from "../config/app.config";

/**
 * Módulo de autenticación que proporciona seguridad basada en JWT para la API Gateway.
 * Configura Passport, JWT y clientes de mensajería para autenticación distribuida.
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || "secretkeydev",
      signOptions: { expiresIn: "1h" },
    }),
    ClientsModule.register([
      {
        name: "NATS_SERVICE",
        transport: Transport.NATS,
        options: {
          servers: [ApiGatewayConfig.messaging.nats.url],
          user: ApiGatewayConfig.messaging.nats.user,
          pass: ApiGatewayConfig.messaging.nats.pass,
        },
      },
      {
        name: "RABBITMQ_SERVICE",
        transport: Transport.RMQ,
        options: {
          urls: ["amqp://rabbit_user:rabbit_password@localhost:5672"],
          queue: "main_queue",
          queueOptions: { durable: true },
          serializer: new CustomRmqSerializer(),
          deserializer: new CustomRmqDeserializer(),
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, NatsDirectClient, MessageRetryBuffer],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
