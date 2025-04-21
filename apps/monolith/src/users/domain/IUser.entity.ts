/**
 * @fileoverview Interface para la entidad User
 * @module Users/Domain/Interface
 * @description Define el contrato base para la representación de usuarios en el dominio.
 * Establece el modelo de datos flexible con propiedades opcionales, delegando validación
 * y obligatoriedad a capas superiores como DTOs, servicios y repositorios.
 */
import { Permission, Role } from "@libs/common/src/auth/enums/role.enum";
import { Schema } from "mongoose";

/**
 * @interface IUserEntity
 * @public
 * @description Interface que define la estructura de un usuario en el sistema
 */
export interface IUserEntity {
  id?: string | undefined | Schema.Types.ObjectId;
  email?: string;
  username?: string;
  name?: string;
  roles?: Role[];
  isActive?: boolean;
  permissions?: Permission[];
  customPermissions?: string[];
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  avatarUrl?: string;
  lastLoginAt?: Date;
  preferences?: {
    language: string;
    currency: string;
    timezone: string;
    notifications: {
      email: boolean;
      sms: boolean;
      marketing: boolean;
      push: boolean;
    };
  };
  securitySettings?: {
    mfaEnabled: boolean;
    loginNotifications: boolean;
    passwordChangeRequired: boolean;
    passwordExpiresAt: Date | null;
    securityQuestions: Array<{
      question: string;
      answerHash: string;
    }>;
  };
  passwordChangedAt?: Date;
  birthDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  devices?: Array<{
    deviceId: string;
    platform: string;
    lastLoginAt: Date;
    isTrusted: boolean;
  }>;
  passwordHash?: string;
}
