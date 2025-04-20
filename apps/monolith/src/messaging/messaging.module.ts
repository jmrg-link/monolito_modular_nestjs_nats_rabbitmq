import { Module } from "@nestjs/common";
import { ClientsModule } from "@nestjs/microservices";
import { NatsSubscriber } from "./nats/NatsSubscriber";
import { NatsMonitorService } from "./nats/NatsMonitorService";
import { RabbitMQConsumer } from "./rabbitmq/rabbitmq.consumer";
import { RabbitMQSetupService } from "./rabbitmq/SetupRabbitMQ";
import { UsersModule } from "../users/users.module";
import { natsConfig, RmqMessageTrap } from "@libs/common/src/microservices";

/**
 * Módulo de mensajería para la integración con NATS y RabbitMQ.
 * Configurado para usar el consumidor manual de RabbitMQ.
 */
@Module({
  imports: [
    ClientsModule.register([
      {
        name: "NATS_SERVICE",
        ...natsConfig,
      },
    ]),
    UsersModule,
  ],
  providers: [
    NatsSubscriber,
    NatsMonitorService,
    RabbitMQConsumer,
    RabbitMQSetupService,
    RmqMessageTrap,
  ],
  exports: [ClientsModule],
})
export class MessagingModule {}
