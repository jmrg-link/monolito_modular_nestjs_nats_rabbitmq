/**
 * DTO para actualización de usuarios existentes
 * Proporciona validaciones flexibles para campos opcionales
 * @module Users/Application/DTO/Update
 */
import {
  IsOptional,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  NotContains,
  ValidateIf,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ExtendsBaseUserDto } from "./ExtendsBaseUser.dto";

/**
 * @class UpdateUserDto - UpdateUser.dto.ts
 * @public class - Clase pública para la actualización de usuarios
 * @extends {ExtendsBaseUserDto} - ExtendsBaseUser.dto.ts
 * @module Users/Application/DTO/Update
 * @description Implementa el contrato para la actualización de usuarios,
 * define validaciones específicas para name, lastName, email y password,
 * hereda propiedades opcionales de ExtendsBaseUserDto para mantener consistencia.
 */
export class UpdateUserDto extends ExtendsBaseUserDto {
  @ApiPropertyOptional({
    description: "Nombre completo del usuario",
    example: "John Doe",
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "name debe tener al menos 2 caracteres" })
  @MaxLength(100, { message: "name no puede exceder 100 caracteres" })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, {
    message: "name solo puede contener letras, espacios, apóstrofes y guiones",
  })
  @Transform(({ value }) => value?.trim())
  name?: string;

  @ApiPropertyOptional({
    description: "Apellidos del usuario",
    example: "Doe",
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: "lastName debe tener al menos 2 caracteres" })
  @MaxLength(100, { message: "lastName no puede exceder 100 caracteres" })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, {
    message:
      "lastName solo puede contener letras, espacios, apóstrofes y guiones",
  })
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @ApiPropertyOptional({
    description: "Correo electrónico único del usuario",
    example: "john.doe@example.com",
    format: "email",
  })
  @IsOptional()
  @IsEmail({}, { message: "email debe ser una dirección válida" })
  @MaxLength(255, { message: "email no puede exceder 255 caracteres" })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({
    description: "Nueva contraseña segura del usuario",
    example: "P@ssw0rd123!",
    minLength: 8,
    maxLength: 100,
    pattern:
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: "password debe tener al menos 8 caracteres" })
  @MaxLength(100, { message: "password no puede exceder 100 caracteres" })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        "password debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial (@$!%*?&)",
    },
  )
  @NotContains(" ", { message: "password no puede contener espacios" })
  password?: string;

  @ApiPropertyOptional({
    description: "Contraseña actual para validación de cambio de contraseña",
    example: "CurrentP@ssw0rd123!",
  })
  @ValidateIf((o) => o.password !== undefined)
  @IsOptional()
  @IsString()
  currentPassword?: string;
}
