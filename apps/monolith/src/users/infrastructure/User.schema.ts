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

@Schema({ _id: false })
export class NotificationSettings {
  @Prop({ default: true })
  email!: boolean;

  @Prop({ default: false })
  sms!: boolean;

  @Prop({ default: true })
  marketing!: boolean;
}

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

@Schema({
  collection: "users",
  timestamps: true,
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

export const UserSchema = SchemaFactory.createForClass(UserDocument);

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
 * Verifica si la cuenta del usuario está bloqueada temporalmente
 * @function isAccountLocked
 * @this {UserDocument}
 * @returns {boolean} True si la cuenta está actualmente bloqueada
 */
UserSchema.methods.isAccountLocked = function (): boolean {
  if (!this.accountLockedUntil) return false;
  return new Date() < this.accountLockedUntil;
};

/**
 * Verifica si el usuario tiene un rol específico asignado
 * @function hasRole
 * @this {UserDocument}
 * @param {Role} role - Rol a verificar
 * @returns {boolean} True si el usuario tiene el rol especificado
 */
UserSchema.methods.hasRole = function (role: Role): boolean {
  return this.roles.includes(role);
};

/**
 * Verifica si el usuario tiene un permiso específico, ya sea directamente asignado
 * o a través de sus roles
 * @function hasPermission
 * @this {UserDocument}
 * @param {Permission|string} permission - Permiso estándar o personalizado a verificar
 * @returns {boolean} True si el usuario tiene el permiso solicitado
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
 * Añade una entrada al registro de auditoría del usuario
 * @function addAuditLogEntry
 * @this {UserDocument}
 * @param {string} adminId - ID del administrador que realiza la acción
 * @param {string} action - Tipo de acción realizada
 * @param {Record<string, unknown>} [details] - Detalles adicionales de la acción
 * @returns {void}
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
 * Campo virtual que representa el nombre completo del usuario
 * @virtual
 * @name fullName
 * @memberof UserDocument
 * @instance
 * @returns {string} Nombre completo formateado
 */
UserSchema.virtual("fullName").get(function () {
  const parts = [this.firstName, this.lastName].filter(Boolean);
  return parts.length ? parts.join(" ") : this.name;
});

/**
 * Campo virtual que calcula la edad del usuario basada en su fecha de nacimiento
 * @virtual
 * @name age
 * @memberof UserDocument
 * @instance
 * @returns {number|null} Edad en años o null si no hay fecha de nacimiento
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
 * Middleware ejecutado antes de guardar un documento de usuario
 * @function pre-save
 * @this {UserDocument}
 * @param {Function} next - Función para continuar el flujo de ejecución
 * @returns {void}
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
