import { IsString, IsNumber, Length } from "class-validator";

/**
 * DTO para creación y actualización de productos.
 * Usa class-validator para validación.
 */
export class ProductDto {
  @IsString()
  @Length(8, 64)
  id!: string;

  @IsString()
  @Length(2, 64)
  name!: string;

  @IsNumber()
  price!: number;

  constructor(partial: Partial<ProductDto>) {
    Object.assign(this, partial);
  }
}
