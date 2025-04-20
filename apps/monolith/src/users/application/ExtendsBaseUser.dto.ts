/**
 * Clase base para DTOs de usuario con propiedades opcionales comunes
 * @abstract
 * @module Users/Application/DTO/Base
 */
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsArray,
  IsDate,
  IsUrl,
  ValidateNested,
  IsMobilePhone,
  Length,
  Matches,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { Role, Permission } from "@libs/common/src/auth/enums/role.enum";

/**
 * DTO para dirección de usuario
 * @class AddressDto - ExtendsBaseUser.dto.ts
 * @property {string} street - Calle y número
 * @property {string} city - Ciudad
 * @property {string} state - Estado o provincia
 * @property {string} postalCode - Código postal
 * @property {string} country - País
 * @description DTO para dirección del usuario
 * @description Incluye calle, ciudad, estado, código postal y país
 * @description Se utiliza para almacenar la dirección de envío o facturación del usuario
 */
class AddressDto {
  @ApiPropertyOptional({
    description: "Calle y número",
    example: "Calle Principal 123",
  })
  @IsOptional()
  @IsString()
  @Length(3, 200)
  street?: string;

  @ApiPropertyOptional({
    description: "Ciudad",
    example: "Madrid",
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;

  @ApiPropertyOptional({
    description: "Estado o provincia",
    example: "Comunidad de Madrid",
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  state?: string;

  @ApiPropertyOptional({
    description: "Código postal",
    example: "28001",
  })
  @IsOptional()
  @IsString()
  @Length(3, 20)
  @Matches(/^[A-Za-z0-9\s\-]+$/, {
    message:
      "postalCode debe contener solo letras, números, espacios y guiones",
  })
  postalCode?: string;

  @ApiPropertyOptional({
    description: "País",
    example: "España",
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  country?: string;
}

/**
 * @class NotificationPreferencesDto - ExtendsBaseUser.dto.ts
 * @property {boolean} email - Notificaciones por email
 * @property {boolean} sms - Notificaciones por SMS
 * @property {boolean} marketing - Notificaciones de marketing
 * @description DTO para preferencias de notificaciones del usuario
 */
class NotificationPreferencesDto {
  @ApiPropertyOptional({
    description: "Notificaciones por email",
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  email?: boolean;

  @ApiPropertyOptional({
    description: "Notificaciones por SMS",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  sms?: boolean;

  @ApiPropertyOptional({
    description: "Notificaciones de marketing",
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  marketing?: boolean;
}

/**
 * DTO para preferencias de usuario
 * @class UserPreferencesDto - ExtendsBaseUser.dto.ts
 * @property {string} language - Idioma preferido
 * @property {string} currency - Moneda preferida
 * @property {string} timezone - Zona horaria
 * @property {NotificationPreferencesDto} notifications - Preferencias de notificaciones
 * @description DTO para preferencias de usuario
 * @description Incluye idioma, moneda, zona horaria y preferencias de notificaciones
 */
class UserPreferencesDto {
  @ApiPropertyOptional({
    description: "Idioma preferido",
    example: "es",
    default: "es",
  })
  @IsOptional()
  @IsString()
  @Length(2, 10)
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, {
    message: "language debe seguir formato ISO (ej: es, en-US)",
  })
  language?: string;

  @ApiPropertyOptional({
    description: "Moneda preferida",
    example: "EUR",
    default: "EUR",
  })
  @IsOptional()
  @IsString()
  @Length(3, 3)
  @Matches(/^[A-Z]{3}$/, {
    message: "currency debe seguir formato ISO 4217 (ej: EUR, USD)",
  })
  currency?: string;

  @ApiPropertyOptional({
    description: "Zona horaria",
    example: "Europe/Madrid",
    default: "Europe/Madrid",
  })
  @IsOptional()
  @IsString()
  @Length(5, 100)
  timezone?: string;

  @ApiPropertyOptional({
    description: "Preferencias de notificaciones",
    type: NotificationPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationPreferencesDto)
  notifications?: NotificationPreferencesDto;
}

/**
 * DTO para pregunta de seguridad
 * @class SecurityQuestionDto - ExtendsBaseUser.dto.ts
 * @property {string} question - Pregunta de seguridad
 * @property {string} answerHash - Hash de la respuesta
 * @description DTO para preguntas de seguridad del usuario
 */
class SecurityQuestionDto {
  @ApiPropertyOptional({
    description: "Pregunta de seguridad",
    example: "¿Cuál es el nombre de tu primera mascota?",
  })
  @IsOptional()
  @IsString()
  @Length(10, 200)
  question?: string;

  @ApiPropertyOptional({
    description: "Hash de la respuesta",
    example: "hashed_answer_123456",
  })
  @IsOptional()
  @IsString()
  @Length(32, 64)
  answerHash?: string;
}

/**
 * @class SecuritySettingsDto - ExtendsBaseUser.dto.ts
 * @property {boolean} mfaEnabled - Autenticación de dos factores
 * @property {boolean} loginNotifications - Notificaciones de inicio de sesión
 * @property {boolean} passwordChangeRequired - Cambio de contraseña requerido
 * @property {Date} passwordExpiresAt - Fecha de expiración de contraseña
 * @property {SecurityQuestionDto[]} securityQuestions - Preguntas de seguridad
 * @description DTO para configuración de seguridad del usuario
 * @description Incluye autenticación de dos factores, notificaciones de inicio de sesión,
 * @description cambio de contraseña requerido y preguntas de seguridad
 */
class SecuritySettingsDto {
  @ApiPropertyOptional({
    description: "Autenticación de dos factores",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  mfaEnabled?: boolean;

  @ApiPropertyOptional({
    description: "Notificaciones de inicio de sesión",
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  loginNotifications?: boolean;

  @ApiPropertyOptional({
    description: "Cambio de contraseña requerido",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  passwordChangeRequired?: boolean;

  @ApiPropertyOptional({
    description: "Fecha de expiración de contraseña",
    example: "2025-12-31T23:59:59Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  passwordExpiresAt?: Date | null;

  @ApiPropertyOptional({
    description: "Preguntas de seguridad",
    type: [SecurityQuestionDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SecurityQuestionDto)
  securityQuestions?: SecurityQuestionDto[];
}

/**
 * @class DeviceDto - ExtendsBaseUser.dto.ts
 * @property {string} deviceId - ID único del dispositivo
 * @property {string} platform - Plataforma del dispositivo
 * @property {Date} lastLoginAt - Fecha del último acceso
 * @property {boolean} isTrusted - Dispositivo de confianza
 * @description DTO para dispositivos del usuario
 * @description Incluye ID del dispositivo, plataforma, fecha del último acceso
 */
class DeviceDto {
  @ApiPropertyOptional({
    description: "ID único del dispositivo",
    example: "device-123-abc",
  })
  @IsOptional()
  @IsString()
  @Length(10, 100)
  deviceId?: string;

  @ApiPropertyOptional({
    description: "Plataforma del dispositivo",
    example: "android",
    enum: ["web", "ios", "android", "desktop", "unknown"],
  })
  @IsOptional()
  @IsString()
  @IsEnum(["web", "ios", "android", "desktop", "unknown"])
  platform?: string;

  @ApiPropertyOptional({
    description: "Fecha del último acceso",
    example: "2025-04-20T12:00:00Z",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lastLoginAt?: Date;

  @ApiPropertyOptional({
    description: "Dispositivo de confianza",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isTrusted?: boolean;
}

/**
 * @abstract ExtendsBaseUserDto - ExtendsBaseUser.dto.ts
 * @property {string} username - Nombre de usuario único
 * @property {Role[]} roles - Roles del usuario
 * @property {boolean} isActive - Estado de activación de la cuenta
 * @property {Permission[]} permissions - Permisos específicos del usuario
 * @property {string[]} customPermissions - Permisos personalizados
 * @property {string} firstName - Nombre de pila
 * @property {string} lastName - Apellidos
 * @property {boolean} emailVerified - Estado de verificación del email
 * @property {string} phoneNumber - Número de teléfono móvil
 * @property {AddressDto} address - Dirección postal completa
 * @property {string} avatarUrl - URL del avatar del usuario
 * @property {UserPreferencesDto} preferences - Preferencias del usuario
 * @property {SecuritySettingsDto} securitySettings - Configuración de seguridad
 * @property {Date} birthDate - Fecha de nacimiento
 * @property {DeviceDto[]} devices - Dispositivos registrados
 * @description DTO para operaciones de usuario
 * @description Clase base para DTOs de usuario con propiedades opcionales comunes
 */
export abstract class ExtendsBaseUserDto {
  @ApiPropertyOptional({
    description: "Nombre de usuario único",
    example: "john.doe",
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(3, 50)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      "username solo puede contener letras, números, puntos, guiones y guiones bajos",
  })
  username?: string;

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
    description: "Estado de activación de la cuenta",
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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

  @ApiPropertyOptional({
    description: "Permisos personalizados",
    isArray: true,
    example: ["custom.permission.example"],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Length(3, 100, { each: true })
  @Matches(/^[a-z0-9.:-]+$/, {
    each: true,
    message:
      "customPermissions debe usar formato: minúsculas, números, puntos, guiones y dos puntos",
  })
  customPermissions?: string[];

  @ApiPropertyOptional({
    description: "Nombre de pila",
    example: "John",
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, {
    message:
      "firstName solo puede contener letras, espacios, apóstrofes y guiones",
  })
  firstName?: string;

  @ApiPropertyOptional({
    description: "Apellidos",
    example: "Doe",
    minLength: 2,
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/, {
    message:
      "lastName solo puede contener letras, espacios, apóstrofes y guiones",
  })
  lastName?: string;

  @ApiPropertyOptional({
    description: "Estado de verificación del email",
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({
    description: "Número de teléfono móvil",
    example: "+34600000000",
  })
  @IsOptional()
  @IsMobilePhone(
    undefined,
    { strictMode: true },
    {
      message:
        "phoneNumber debe ser un número de teléfono válido con código de país",
    },
  )
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: "Dirección postal completa",
    type: AddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    description: "URL del avatar del usuario",
    example: "https://example.com/avatar.jpg",
  })
  @IsOptional()
  @IsUrl({
    protocols: ["http", "https"],
    require_protocol: true,
  })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: "Preferencias del usuario",
    type: UserPreferencesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserPreferencesDto)
  preferences?: UserPreferencesDto;

  @ApiPropertyOptional({
    description: "Configuración de seguridad",
    type: SecuritySettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SecuritySettingsDto)
  securitySettings?: SecuritySettingsDto;

  @ApiPropertyOptional({
    description: "Fecha de nacimiento",
    example: "1990-01-01",
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  birthDate?: Date;

  @ApiPropertyOptional({
    description: "Dispositivos registrados",
    type: [DeviceDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeviceDto)
  devices?: DeviceDto[];
}
