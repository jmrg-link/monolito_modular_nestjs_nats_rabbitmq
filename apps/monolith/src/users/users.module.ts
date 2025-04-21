/**
 * @fileoverview Módulo de usuarios que configura las dependencias y componentes necesarios
 * @module Users/Module
 * @description Define y configura los controladores, servicios y repositorios relacionados con la gestión de usuarios.
 * Implementa el patrón de Inyección de Dependencias proporcionando las implementaciones concretas de las interfaces.
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
 * @class UsersModule
 * @implements {NestModule}
 * @description Módulo principal para la gestión de usuarios en el sistema de UserModule.
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
          servers: [process.env.NATS_SERVER || "nats://localhost:4222"],
        },
      },
      {
        name: "RABBITMQ_SERVICE",
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || "amqp://localhost:5672"],
          queue: "users_queue",
          queueOptions: {
            durable: true,
          },
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
  exports: [UserService],
})
export class UsersModule {}
