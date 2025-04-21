/**
 * DTO para creación de nuevos usuarios
 * Protege la entrada de datos mediante validaciones estrictas
 * @module Users/Application/DTO/Create
 */
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  NotContains,
  IsOptional,
  IsArray,
  IsEnum,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Role, Permission } from "@libs/common/src/auth/enums/role.enum";
// import { ExtendsBaseUserDto } from "./ExtendsBaseUser.dto";

/**
 * @class CreateUserDto - CreateUser.dto.ts
 * @extends {ExtendsBaseUserDto} - Clase extendida contiene propiedades opcionales
 * @public class - Clase pública para la creación de usuarios
 * @Description Implementa el contrato para la creación de usuarios con campos obligatorios ,
 * define validaciones específicas para name, lastName, email y password,
 * hereda propiedades opcionales de ExtendsBaseUserDto para mantener consistencia.
 */
export class CreateUserDto {
  @ApiProperty({
    description: "Nombre completo del usuario",
    example: "John Doe",
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: "name es obligatorio" })
  @IsString()
  @MinLength(2, { message: "name debe tener al menos 2 caracteres" })
  @MaxLength(100, { message: "name no puede exceder 100 caracteres" })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, {
    message: "name solo puede contener letras, espacios, apóstrofes y guiones",
  })
  @Transform(({ value }) => value?.trim())
  name!: string;

  @ApiProperty({
    description: "Apellidos del usuario",
    example: "Doe",
    minLength: 2,
    maxLength: 100,
  })
  @IsNotEmpty({ message: "lastName es obligatorio" })
  @IsString()
  @MinLength(2, { message: "lastName debe tener al menos 2 caracteres" })
  @MaxLength(100, { message: "lastName no puede exceder 100 caracteres" })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, {
    message:
      "lastName solo puede contener letras, espacios, apóstrofes y guiones",
  })
  @Transform(({ value }) => value?.trim())
  lastName!: string;

  @ApiProperty({
    description: "Correo electrónico único del usuario",
    example: "john.doe@example.com",
    format: "email",
  })
  @IsNotEmpty({ message: "email es obligatorio" })
  @IsEmail({}, { message: "email debe ser una dirección válida" })
  @MaxLength(255, { message: "email no puede exceder 255 caracteres" })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({
    description: "Contraseña segura del usuario",
    example: "P@ssw0rd123!",
    minLength: 8,
    maxLength: 100,
    pattern:
      "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
  })
  @IsNotEmpty({ message: "password es obligatorio" })
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
  password!: string;

  @ApiPropertyOptional({
    description: "Roles del usuario",
    enum: Role,
    isArray: true,
    example: [Role.DEFAULT],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @ApiPropertyOptional({
    description: "Permisos específicos del usuario",
    enum: Permission,
    isArray: true,
    example: [Permission.READ_PROFILE, Permission.UPDATE_PROFILE],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions?: Permission[];
}
