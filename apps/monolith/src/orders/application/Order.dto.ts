import { IsString, IsNumber, Length } from "class-validator";

/**
 * DTO para creación y actualización de órdenes.
 * Usa class-validator para validación.
 */
export class OrderDto {
  @IsString()
  @Length(8, 64)
  id!: string;

  @IsString()
  @Length(8, 64)
  userId!: string;

  @IsNumber()
  total!: number;

  constructor(partial: Partial<OrderDto>) {
    Object.assign(this, partial);
  }
}
