/**
 * @file Módulo de usuarios
 * @module Users/Module
 * @description Registra los componentes e infraestructura para la funcionalidad de usuarios
 */
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ClientsModule, Transport } from "@nestjs/microservices";

import { UserController } from "./user.controller";
import { PublicUserController } from "./public-user.controller";
import { UserService } from "./application/User.service";
import { MongoUserRepository } from "./infrastructure/User.implement.repository";
import { UserDocument, UserSchema } from "./infrastructure/User.schema";

/**
 * Módulo que configura y expone la funcionalidad de gestión de usuarios
 * @class UsersModule
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserDocument.name, schema: UserSchema },
    ]),
    ClientsModule.register([
      {
        name: "NATS_SERVICE",
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || "nats://localhost:4222"],
        },
      },
      {
        name: "RABBITMQ_SERVICE",
        transport: Transport.RMQ,
        options: {
          urls: [
            process.env.RABBITMQ_URL || "amqp://user:password@localhost:5672",
          ],
          queue: "main_queue",
          queueOptions: { durable: true },
        },
      },
    ]),
  ],
  controllers: [UserController, PublicUserController],
  providers: [
    UserService,
    {
      provide: "IUserRepository",
      useClass: MongoUserRepository,
    },
  ],
  exports: [UserService, "IUserRepository"],
})
export class UsersModule {}
