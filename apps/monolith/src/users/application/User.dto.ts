/**
 * @file DTOs para la entidad Usuario
 * @description Define los objetos de transferencia de datos para operaciones de usuario
 */
import {
  IsEmail,
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsEnum,
  IsPhoneNumber,
  IsUrl,
  IsObject,
  ValidateNested,
  Length,
  Matches,
  MinLength,
  MaxLength,
  IsDateString,
  IsNotEmpty,
} from "class-validator";
import {
  Exclude,
  Expose,
  Transform,
  Type,
  plainToInstance,
  ClassTransformer,
  classToPlain,
} from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role, Permission } from "@libs/common/src/auth/enums/role.enum";

/**
 * @class Dirección postal del usuario
 */
export class AddressDto {
  @ApiProperty({ description: "Calle y número" })
  @IsString()
  @Length(3, 100)
  street!: string;

  @ApiProperty({ description: "Ciudad" })
  @IsString()
  @Length(2, 50)
  city!: string;

  @ApiProperty({ description: "Estado/Provincia" })
  @IsString()
  @Length(2, 50)
  state!: string;

  @ApiProperty({ description: "Código postal" })
  @IsString()
  @Length(3, 15)
  postalCode!: string;

  @ApiProperty({ description: "País" })
  @IsString()
  @Length(2, 50)
  country!: string;
}

/**
 * @class Preferencias de notificaciones del usuario
 */
export class NotificationSettingsDto {
  @ApiProperty({
    description: "Recibir notificaciones por email",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? true : value))
  email?: boolean = true;

  @ApiProperty({
    description: "Recibir notificaciones por SMS",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? false : value))
  sms?: boolean = false;

  @ApiProperty({
    description: "Recibir comunicaciones de marketing",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? true : value))
  marketing?: boolean = true;
}

/**
 * @class Configuración de seguridad del usuario
 */
export class SecuritySettingsDto {
  @ApiProperty({
    description: "Autenticación de dos factores activada",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? false : value))
  mfaEnabled?: boolean = false;

  @ApiProperty({
    description: "Recibir notificaciones de inicio de sesión",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? true : value))
  loginNotifications?: boolean = true;

  @ApiProperty({
    description: "Requiere cambio de contraseña en próximo login",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? false : value))
  passwordChangeRequired?: boolean = false;

  @ApiPropertyOptional({
    description: "Fecha de expiración de la contraseña",
    nullable: true,
  })
  @IsDateString()
  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : undefined))
  passwordExpiresAt?: string = undefined;

  @ApiPropertyOptional({
    description: "Preguntas de seguridad",
    type: [Object],
  })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => value || [])
  securityQuestions?: Array<{
    question: string;
    answerHash: string;
  }> = [];
}

/**
 * @class Preferencias del usuario
 */
export class PreferencesDto {
  @ApiProperty({
    description: "Idioma preferido",
    default: "es",
    example: "es",
  })
  @IsString()
  @IsOptional()
  @Length(2, 5)
  @Transform(({ value }) => value || "es")
  language?: string = "es";

  @ApiProperty({
    description: "Moneda preferida",
    default: "EUR",
    example: "EUR",
  })
  @IsString()
  @IsOptional()
  @Length(3, 3)
  @Transform(({ value }) => value || "EUR")
  currency?: string = "EUR";

  @ApiProperty({
    description: "Zona horaria",
    default: "Europe/Madrid",
    example: "Europe/Madrid",
  })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value || "Europe/Madrid")
  timezone?: string = "Europe/Madrid";

  @ApiProperty({ description: "Configuración de notificaciones" })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationSettingsDto)
  @Transform(({ value }) => value || new NotificationSettingsDto())
  notifications?: NotificationSettingsDto = new NotificationSettingsDto();
}

/**
 * @class Propiedades base comunes para todos los usuarios
 */
export class UserBaseDto {
  @ApiProperty({ description: "Correo electrónico del usuario" })
  @IsEmail({}, { message: "El formato del email no es válido" })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({ description: "Nombre de usuario único", example: "johndoe" })
  @IsString()
  @Length(3, 30, {
    message: "El nombre de usuario debe tener entre 3 y 30 caracteres",
  })
  @Transform(
    ({ value, obj }) => value || (obj.email ? obj.email.split("@")[0] : null),
  )
  username!: string;

  @ApiProperty({ description: "Nombre del usuario" })
  @IsString()
  @Length(2, 50, { message: "El nombre debe tener entre 2 y 50 caracteres" })
  name!: string;

  @ApiPropertyOptional({ description: "Primer apellido" })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  firstName?: string;

  @ApiPropertyOptional({ description: "Segundo apellido" })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  lastName?: string;

  @ApiPropertyOptional({
    description: "Número de teléfono",
    example: "+34600000000",
  })
  @IsPhoneNumber(undefined, { message: "El formato del teléfono no es válido" })
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({ description: "URL del avatar o imagen de perfil" })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;
}

/**
 * @class Información del dispositivo del usuario
 */
export class DeviceInfoDto {
  @ApiProperty({ description: "Identificador único del dispositivo" })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value || `device_${Date.now()}`)
  deviceId!: string;

  @ApiProperty({
    description: "Plataforma del dispositivo",
    enum: ["web", "ios", "android", "desktop", "unknown"],
    example: "web",
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value || "unknown")
  platform!: string;

  @ApiPropertyOptional({
    description: "Nombre del dispositivo",
    example: "iPhone 13 Pro",
  })
  @IsString()
  @IsOptional()
  deviceName?: string;

  @ApiPropertyOptional({ description: "Dirección IP", example: "192.168.1.1" })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: "User Agent", example: "Mozilla/5.0..." })
  @IsString()
  @IsOptional()
  userAgent?: string;

  @ApiPropertyOptional({
    description: "Ubicación del inicio de sesión",
    example: "Madrid, España",
  })
  @IsString()
  @IsOptional()
  lastLocation?: string;
}

/**
 * @class DTO para creación de usuarios
 */
export class CreateUserDto extends UserBaseDto {
  @ApiProperty({
    description: "Contraseña del usuario",
    minLength: 8,
    example: "P@ssw0rd123",
  })
  @IsString()
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  @MaxLength(50, { message: "La contraseña no debe exceder 50 caracteres" })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      "La contraseña debe contener al menos una mayúscula, una minúscula y un número o caracter especial",
  })
  password!: string;

  @ApiPropertyOptional({
    description: "Fecha de nacimiento",
    example: "1990-01-01",
  })
  @IsDateString()
  @IsOptional()
  @Transform(({ value }) =>
    value ? new Date(value).toISOString().split("T")[0] : undefined,
  )
  birthDate?: string;

  @ApiPropertyOptional({
    description: "Roles del usuario",
    default: [Role.DEFAULT],
    enum: Role,
    isArray: true,
    example: [Role.DEFAULT],
  })
  @IsEnum(Role, { each: true, message: "Rol no válido" })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => value || [Role.DEFAULT])
  roles?: Role[] = [Role.DEFAULT];

  @ApiPropertyOptional({
    description: "Permisos personalizados (no estándar)",
    isArray: true,
    example: ["custom:action"],
  })
  @IsString({ each: true })
  @IsArray()
  @IsOptional()
  @Transform(({ value }) => value || [])
  customPermissions?: string[] = [];

  @ApiPropertyOptional({
    description: "Dirección del usuario",
    type: () => AddressDto,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    description: "Preferencias del usuario",
    type: () => PreferencesDto,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  @Transform(({ value }) => value || new PreferencesDto())
  preferences?: PreferencesDto;

  @ApiPropertyOptional({
    description: "Configuración de seguridad",
    type: () => SecuritySettingsDto,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => SecuritySettingsDto)
  @Transform(({ value }) => value || new SecuritySettingsDto())
  securitySettings?: SecuritySettingsDto;

  @ApiPropertyOptional({
    description: "Información del dispositivo que realiza el registro",
    type: () => DeviceInfoDto,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  device?: DeviceInfoDto;

  /**
   * Convierte un objeto plano a instancia tipada de CreateUserDto
   * @param plainObject - Objeto plano a convertir
   * @returns Instancia tipada de CreateUserDto
   */
  static fromPlain(plainObject: Record<string, unknown>): CreateUserDto {
    return plainToInstance(CreateUserDto, plainObject, {
      enableImplicitConversion: true,
      excludeExtraneousValues: false,
    });
  }
}

/**
 * DTO para respuesta de usuario (hacia el cliente)
 */
@Exclude()
export class UserResponseDto {
  @Expose()
  @ApiProperty({ description: "ID único del usuario" })
  id!: string;

  @Expose()
  @ApiProperty({ description: "Correo electrónico" })
  email!: string;

  @Expose()
  @ApiProperty({ description: "Nombre" })
  name!: string;

  @Expose()
  @ApiPropertyOptional({ description: "Primer apellido" })
  firstName?: string;

  @Expose()
  @ApiPropertyOptional({ description: "Segundo apellido" })
  lastName?: string;

  @Expose()
  @ApiProperty({
    enum: Role,
    isArray: true,
    description: "Roles asignados al usuario",
  })
  roles!: Role[];

  @Expose()
  @ApiProperty({
    enum: Permission,
    isArray: true,
    description: "Permisos estándar del usuario",
  })
  permissions!: Permission[];

  @Expose()
  @ApiPropertyOptional({
    isArray: true,
    description: "Permisos personalizados no estándar",
  })
  customPermissions?: string[];

  @Expose()
  @ApiProperty({ description: "Estado activo del usuario" })
  isActive!: boolean;

  @Expose()
  @ApiProperty({ description: "Email verificado" })
  emailVerified!: boolean;

  @Expose()
  @ApiPropertyOptional({ description: "Último inicio de sesión" })
  lastLoginAt?: Date;

  @Expose()
  @ApiPropertyOptional({ description: "Fecha de nacimiento", type: Date })
  birthDate?: Date;

  @Expose()
  @ApiPropertyOptional({ description: "Edad calculada en años", type: Number })
  get age(): number | null {
    if (!this.birthDate) return null;
    const today = new Date();
    const birthDate = new Date(this.birthDate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  @Expose()
  @ApiProperty({ description: "Fecha de creación" })
  createdAt!: Date;

  @Expose()
  @ApiProperty({ description: "Última actualización" })
  updatedAt!: Date;

  @Expose()
  @ApiPropertyOptional({ description: "URL del avatar" })
  avatarUrl?: string;

  @Expose()
  @ApiPropertyOptional({
    description: "Dirección del usuario",
    type: () => AddressDto,
  })
  address?: AddressDto;

  @Expose()
  @ApiPropertyOptional({
    description: "Preferencias del usuario",
    type: () => PreferencesDto,
  })
  preferences?: PreferencesDto;

  @Expose()
  @ApiPropertyOptional({
    description: "Configuración de seguridad",
    type: () => SecuritySettingsDto,
  })
  securitySettings?: SecuritySettingsDto;

  @Expose()
  @ApiPropertyOptional({
    description: "Dispositivos asociados",
    type: [DeviceInfoDto],
  })
  devices?: Array<{
    deviceId: string;
    platform: string;
    lastLoginAt: Date;
    deviceName?: string;
    isTrusted: boolean;
  }>;

  @Expose()
  @ApiPropertyOptional({ description: "Número de teléfono" })
  phoneNumber?: string;

  @Expose()
  @ApiPropertyOptional({
    description: "Indica si el usuario está eliminado (soft delete)",
  })
  get isDeleted(): boolean {
    return !!this.deletedAt;
  }

  @Expose({ groups: ["admin"] })
  @ApiPropertyOptional({ description: "Fecha de eliminación lógica" })
  deletedAt?: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * DTO para actualización de usuario
 */
export class UpdateUserDto {
  @ApiPropertyOptional({ description: "Nombre del usuario" })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  name?: string;

  @ApiPropertyOptional({ description: "Primer apellido" })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  firstName?: string;

  @ApiPropertyOptional({ description: "Segundo apellido" })
  @IsString()
  @IsOptional()
  @Length(2, 50)
  lastName?: string;

  @ApiPropertyOptional({ description: "URL del avatar o imagen de perfil" })
  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: "Roles del usuario",
    enum: Role,
    isArray: true,
  })
  @IsEnum(Role, { each: true })
  @IsArray()
  @IsOptional()
  roles?: Role[];

  @ApiPropertyOptional({
    description: "Permisos específicos del usuario",
    enum: Permission,
    isArray: true,
  })
  @IsEnum(Permission, { each: true })
  @IsArray()
  @IsOptional()
  permissions?: Permission[];

  @ApiPropertyOptional({ description: "Estado activo del usuario" })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: "Dirección del usuario",
    type: () => AddressDto,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    description: "Preferencias del usuario",
    type: () => PreferencesDto,
  })
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => PreferencesDto)
  preferences?: PreferencesDto;

  @ApiPropertyOptional({
    description: "Número de teléfono",
    example: "+34600000000",
  })
  @IsPhoneNumber(undefined)
  @IsOptional()
  phoneNumber?: string;
}

/**
 * DTO para cambio de contraseña
 */
export class ChangePasswordDto {
  @ApiProperty({ description: "Contraseña actual" })
  @IsString()
  currentPassword!: string;

  @ApiProperty({
    description: "Nueva contraseña",
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  @MaxLength(50)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      "La contraseña debe contener al menos una mayúscula, una minúscula y un número o caracter especial",
  })
  newPassword!: string;
}

/**
 * DTO para restablecimiento de contraseña
 */
export class ResetPasswordDto {
  @ApiProperty({ description: "Token de restablecimiento" })
  @IsString()
  token!: string;

  @ApiProperty({
    description: "Nueva contraseña",
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  @MaxLength(50)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      "La contraseña debe contener al menos una mayúscula, una minúscula y un número o caracter especial",
  })
  password!: string;
}

/**
 * DTO para solicitud de restablecimiento de contraseña
 */
export class ForgotPasswordDto {
  @ApiProperty({ description: "Correo electrónico" })
  @IsEmail({}, { message: "El formato del email no es válido" })
  email!: string;
}

/**
 * DTO para registro/login de dispositivo
 */
export class DeviceDto {
  @ApiProperty({ description: "Identificador único del dispositivo" })
  @IsString()
  deviceId!: string;

  @ApiProperty({
    description: "Plataforma del dispositivo",
    example: "Android/iOS/Web",
  })
  @IsString()
  platform!: string;

  @ApiPropertyOptional({
    description: "Nombre del dispositivo",
    example: "iPhone 12 de Juan",
  })
  @IsString()
  @IsOptional()
  deviceName?: string;

  @ApiPropertyOptional({ description: "Dirección IP" })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiPropertyOptional({ description: "User agent del navegador/dispositivo" })
  @IsString()
  @IsOptional()
  userAgent?: string;
}
