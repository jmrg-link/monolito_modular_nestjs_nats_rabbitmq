/**
 * Módulo de productos del monolito DDD.
 * Gestiona la lógica de dominio, aplicación e infraestructura de productos.
 */
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ProductController } from "./product.controller";
import { ProductRepository } from "./infrastructure/Product.repository";
import {
  ProductDocument,
  ProductSchema,
} from "./infrastructure/Product.schema";
import { ProductService } from "./application/Product.service";
import { MessagingModule } from "../messaging/messaging.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductDocument.name, schema: ProductSchema },
    ]),
    MessagingModule,
  ],
  providers: [ProductRepository, ProductService],
  controllers: [ProductController],
  exports: [ProductRepository, ProductService],
})
export class ProductsModule {}
