import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

/**
 * Esquema de orden para MongoDB.
 */
@Schema({ timestamps: true })
export class OrderDocument extends Document {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  total!: number;

  @Prop({ type: [String], default: [] })
  products!: string[];

  @Prop({ default: "pending" })
  status!: string;

  @Prop()
  paidAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(OrderDocument);
