/**
 * @file Esquema MongoDB para entidad de usuario
 * @module Users/Infrastructure
 * @description Define el esquema de datos, índices, validadores y métodos para la colección de usuarios en MongoDB
 */
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import {
  Permission,
  Role,
  RolePermissions,
} from "@libs/common/src/auth/enums/role.enum";
import { randomUUID } from "crypto";

/**
 * @class public {string} Address
 * @property {string & { required: true, trim: true }} street - Calle de la dirección
 * @property {string & { required: true, trim: true }} city - Ciudad de la dirección
 * @property {string & { required: true, trim: true }} state - Estado/Provincia de la dirección
 * @property {string & { required: true, trim: true }} postalCode - Código postal de la dirección
 * @property {string & { required: true, trim: true }} country - País de la dirección
 * @description Clase que representa una dirección física asociada a un usuario
 */
@Schema({ _id: false })
export class Address {
  @Prop({ required: true, trim: true })
  street!: string;

  @Prop({ required: true, trim: true })
  city!: string;

  @Prop({ required: true, trim: true })
  state!: string;

  @Prop({ required: true, trim: true })
  postalCode!: string;

  @Prop({ required: true, trim: true })
  country!: string;
}

/**
 * @class public {string} NotificationSettings
 * @property {boolean & { default: true }} email - Configuración de notificaciones por correo electrónico
 * @property {boolean & { default: false }} sms - Configuración de notificaciones por SMS
 * @property {boolean & { default: true }} marketing - Configuración de notificaciones de marketing
 * @property {boolean & { default: false }} push - Configuración de notificaciones push
 * @description Clase que representa la configuración de notificaciones del usuario
 */
@Schema({ _id: false })
export class NotificationSettings {
  @Prop({ default: true })
  email!: boolean;

  @Prop({ default: false })
  sms!: boolean;

  @Prop({ default: true })
  marketing!: boolean;

  @Prop({ default: false })
  push!: boolean;
}

/**
 * @class public {string} Preferences
 * @property {string & { default: "es" }} language - Idioma preferido del usuario
 * @property {string & { default: "EUR" }} currency - Moneda preferida del usuario
 * @property {string & { default: "Europe/Madrid" }} timezone - Zona horaria preferida del usuario
 * @property {NotificationSettings} notifications - Configuración de notificaciones del usuario
 * @description Clase que representa las preferencias del usuario
 */
@Schema({ _id: false })
export class Preferences {
  @Prop({ default: "es" })
  language!: string;

  @Prop({ default: "EUR" })
  currency!: string;

  @Prop({ default: "Europe/Madrid" })
  timezone!: string;

  @Prop({ type: NotificationSettings })
  notifications!: NotificationSettings;
}

/**
 * @class public {string} Device
 * @property {string & { required: true, default: () => randomUUID() }} deviceId - ID único del dispositivo
 * @property {string & { required: true, enum: ["web", "ios", "android", "desktop", "unknown"] }} platform - Plataforma del dispositivo
 * @property {Date & { required: true, default: () => new Date() }} lastLoginAt - Fecha y hora del último inicio de sesión
 * @property {string} deviceName - Nombre del dispositivo
 * @property {string} ipAddress - Dirección IP del dispositivo
 * @property {string} userAgent - User agent del dispositivo
 * @property {boolean & { default: false }} isTrusted - Indica si el dispositivo es de confianza
 * @property {string} lastLocation - Última ubicación conocida del dispositivo
 * @description Clase que representa un dispositivo asociado a un usuario
 */
@Schema({ _id: false })
export class Device {
  @Prop({ required: true, default: () => randomUUID() })
  deviceId!: string;

  @Prop({
    required: true,
    enum: ["web", "ios", "android", "desktop", "unknown"],
  })
  platform!: string;

  @Prop({ required: true, default: () => new Date() })
  lastLoginAt!: Date;

  @Prop({ trim: true })
  deviceName?: string;

  @Prop({ trim: true })
  ipAddress?: string;

  @Prop({ trim: true })
  userAgent?: string;

  @Prop({ default: false })
  isTrusted!: boolean;

  @Prop()
  lastLocation?: string;
}

/**
 * @class public {string} UserDocument
 * @extends Document
 * @description Clase que representa un documento de usuario en MongoDB
 * @property {string} email - Correo electrónico del usuario
 * @property {string} username - Nombre de usuario
 * @property {string} name - Nombre completo del usuario
 * @property {string} firstName - Primer nombre del usuario
 * @property {string} lastName - Apellido del usuario
 * @property {string} phoneNumber - Número de teléfono del usuario
 * @property {Date} birthDate - Fecha de nacimiento del usuario
 * @property {string} avatarUrl - URL de la imagen de perfil del usuario
 * @property {string} passwordHash - Hash de la contraseña del usuario
 * @property {Role[]} roles - Roles asignados al usuario
 * @property {Permission[]} permissions - Permisos asignados al usuario
 * @property {boolean} isActive - Indica si la cuenta está activa
 */
@Schema({
  _id: true,
  collection: "users",
  timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  versionKey: false,
  toJSON: {
    transform: (_, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.passwordHash;
      delete ret.refreshToken;
      delete ret.__v;
      return ret;
    },
  },
})
export class UserDocument extends Document {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email!: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    index: true,
  })
  username!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ trim: true, required: true })
  firstName?: string;

  @Prop({ trim: true, required: true })
  lastName?: string;

  @Prop({ trim: true, unique: true, sparse: true })
  phoneNumber?: string;

  @Prop()
  birthDate?: Date;

  @Prop()
  avatarUrl?: string;

  @Prop({ required: true, select: false })
  passwordHash!: string;

  @Prop({
    type: [String],
    default: [Role.DEFAULT],
    enum: Object.values(Role),
    index: true,
  })
  roles!: Role[];

  @Prop({
    type: [String],
    enum: Object.values(Permission),
    default: [],
    validate: {
      validator: function (v: string[]) {
        return v.every((permission) =>
          Object.values(Permission).includes(permission as Permission),
        );
      },
      message: (props: { value: string[] }) =>
        `${props.value} contiene permisos no válidos`,
    },
  })
  permissions!: Permission[];

  @Prop({
    type: [String],
    default: [],
  })
  customPermissions!: string[];

  @Prop({ default: true, index: true })
  isActive!: boolean;

  @Prop({ default: false })
  emailVerified!: boolean;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  emailVerificationExpires?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop()
  passwordChangedAt?: Date;

  @Prop()
  lastLoginAt?: Date;

  @Prop()
  lastLoginIp?: string;

  @Prop({ default: 0 })
  failedLoginAttempts!: number;

  @Prop()
  accountLockedUntil?: Date;

  @Prop({ select: false })
  refreshToken?: string;

  @Prop({ type: [Device], default: [] })
  devices!: Device[];

  @Prop({ type: Address })
  address?: Address;

  @Prop({ type: Preferences, default: () => ({}) })
  preferences!: Preferences;

  @Prop({ type: MongooseSchema.Types.Mixed })
  billingInfo?: Record<string, unknown>;

  @Prop({ type: [Object], default: [] })
  auditLog!: Array<{
    action: string;
    performedBy: string;
    timestamp: Date;
    details?: Record<string, unknown>;
  }>;

  @Prop({
    type: Object,
    default: {
      mfaEnabled: false,
      loginNotifications: true,
      passwordChangeRequired: false,
      passwordExpiresAt: null,
      securityQuestions: [],
    },
  })
  securitySettings!: {
    mfaEnabled: boolean;
    loginNotifications: boolean;
    passwordChangeRequired: boolean;
    passwordExpiresAt?: Date | null;
    securityQuestions: Array<{
      question: string;
      answerHash: string;
    }>;
  };

  @Prop({ type: MongooseSchema.Types.Mixed })
  metadata?: Record<string, unknown>;

  @Prop()
  deletedAt?: Date;

  @Prop()
  deletedBy?: string;
}

/**
 * @constant {UserDocument} UserSchema
 * @type {UserDocument}
 * @description Esquema de Mongoose para la colección de usuarios
 */
export const UserSchema = SchemaFactory.createForClass(UserDocument);

/**
 * @constant {string} UserSchemaName
 * @type {string}
 * @description Indice de email único ascendente para la colección de usuarios
 * @description indice de roles ascendente para la colección de usuarios
 * @description indice de permisos ascendente para la colección de usuarios
 * @description indice de isActive ascendente para la colección de usuarios
 * @description indice de address.country y address.city ascendente para la colección de usuarios
 * @description indice de createdAt descendente para la colección de usuarios
 * @description indice de búsqueda de texto para nombre, primer nombre, apellido y correo electrónico
 * @description indice de nombre de búsqueda de texto para la colección de usuarios con weights de 10 para email, 5 para nombre, 3 para primer nombre y 3 para apellido
 */
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ roles: 1 });
UserSchema.index({ permissions: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ "address.country": 1, "address.city": 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index(
  {
    name: "text",
    firstName: "text",
    lastName: "text",
    email: "text",
  },
  {
    name: "user_text_search",
    weights: {
      email: 10,
      name: 5,
      firstName: 3,
      lastName: 3,
    },
  },
);

/**
 * @function isAccountLocked
 * @this {UserDocument}
 * @returns {boolean} True si la cuenta está actualmente bloqueada
 * @description Verifica si la cuenta del usuario está bloqueada temporalmente debido a múltiples intentos fallidos de inicio de sesión o bloqueo manual
 */
UserSchema.methods.isAccountLocked = function (): boolean {
  if (!this.accountLockedUntil) return false;
  return new Date() < this.accountLockedUntil;
};

/**
 * @function hasRole
 * @this {UserDocument}
 * @param {Role} role - Rol a verificar
 * @returns {boolean} True si el usuario tiene el rol especificado
 * @description Verifica si el usuario tiene un rol específico asignado
 */
UserSchema.methods.hasRole = function (role: Role): boolean {
  return this.roles.includes(role);
};

/**
 * @function hasPermission
 * @this {UserDocument} - Referencia al documento de usuario
 * @param {Permission|string} permission - Permiso estándar o personalizado a verificar
 * @returns {boolean} True si el usuario tiene el permiso solicitado
 * @description Verifica si el usuario tiene un permiso específico, ya sea directamente asignado
 * o a través de sus roles
 */
UserSchema.methods.hasPermission = function (
  permission: Permission | string,
): boolean {
  if (this.permissions.includes(permission as Permission)) return true;
  if (this.customPermissions.includes(permission as string)) return true;
  if (this.roles.includes(Role.ADMIN)) return true;
  for (const userRole of this.roles) {
    const typedRole = userRole as Role;
    if (
      RolePermissions[typedRole] &&
      RolePermissions[typedRole].includes(permission as Permission)
    ) {
      return true;
    }
  }

  return false;
};

/**
 * @function addAuditLogEntry - Añade una entrada al registro de auditoría del usuario
 * @this {UserDocument} - Referencia al documento de usuario
 * @param {string} adminId - ID del administrador que realiza la acción
 * @param {string} action - Tipo de acción realizada
 * @param {Record<string, unknown>} [details] - Detalles adicionales de la acción
 * @returns {void}
 * @description Añade una entrada al registro de auditoría del usuario con información sobre la acción realizada
 */
UserSchema.methods.addAuditLogEntry = function (
  adminId: string,
  action: string,
  details?: Record<string, unknown>,
): void {
  this.auditLog.push({
    action,
    performedBy: adminId,
    timestamp: new Date(),
    details,
  });
};

/**
 * @virtual
 * @name fullName
 * @memberof UserDocument
 * @instance
 * @returns {string} Nombre completo formateado
 * @description Campo virtual que representa el nombre completo del usuario con el formato "{firstName} {lastName}". Si no hay nombre o apellido, se utiliza el campo "name"
 *  si ambos están vacíos, devuelve una cadena vacía.
 */
UserSchema.virtual("fullName").get(function () {
  const parts = [this.firstName, this.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : this.name;
});

/**
 * @function virtual
 * @name age
 * @memberof UserDocument
 * @instance
 * @returns {number|null} Edad en años o null si no hay fecha de nacimiento
 * @description Campo virtual que calcula la edad del usuario basada en su fecha de nacimiento
 */
UserSchema.virtual("age").get(function () {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

/**
 * @function pre-save
 * @this {UserDocument}
 * @param {Function} next - Función para continuar el flujo de ejecución
 * @returns {void}
 * @description Middleware ejecutado antes de guardar un documento de usuario en la base de datos.
 * Convierte el correo electrónico a minúsculas y establece el nombre de usuario por defecto si no se proporciona.
 */
UserSchema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase().trim();
  }

  if (this.isModified("username") && !this.username) {
    this.username = this.email.split("@")[0];
  }

  next();
});
