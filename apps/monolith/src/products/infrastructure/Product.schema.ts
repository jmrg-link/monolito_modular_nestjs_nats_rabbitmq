import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

/**
 * Esquema de producto para MongoDB.
 */
@Schema({ timestamps: true })
export class ProductDocument extends Document {
  @Prop({ required: true, unique: true })
  name!: string;

  @Prop({ required: true })
  price!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  description?: string;
}

export const ProductSchema = SchemaFactory.createForClass(ProductDocument);
