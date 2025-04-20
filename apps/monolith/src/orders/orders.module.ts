/**
 * Módulo de órdenes del monolito DDD.
 * Gestiona la lógica de dominio, aplicación e infraestructura de órdenes.
 */
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { OrderController } from "./order.controller";
import { OrderRepository } from "./infrastructure/Order.repository";
import { OrderDocument, OrderSchema } from "./infrastructure/Order.schema";
import { OrderService } from "./application/Order.service";
import { MessagingModule } from "../messaging/messaging.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrderDocument.name, schema: OrderSchema },
    ]),
    MessagingModule,
  ],
  providers: [OrderRepository, OrderService],
  controllers: [OrderController],
  exports: [OrderRepository, OrderService],
})
export class OrdersModule {}
