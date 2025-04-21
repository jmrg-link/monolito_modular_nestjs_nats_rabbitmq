/**
 * @fileoverview Entidad User del dominio
 * @module Users/Domain/Entity
 * @description Modela la representación de un usuario siguiendo el patrón de entidad anémica.
 * Proporciona transformaciones de datos mediante getUserObject() y getUserObjects().
 * Todas las propiedades son opcionales para flexibilidad en la construcción de objetos.
 */
import { Permission, Role } from "@libs/common/src/auth/enums/role.enum";
import { IUserEntity } from "./IUser.entity";
import { Schema } from "mongoose";

/**
 * Entidad User que implementa IUserEntity
 * @class User
 * @implements {IUserEntity}
 * @public
 */
export class User implements IUserEntity {
  /**
   * @constructor
   * @param {string | undefined | Schema.Types.ObjectId} [id] - Identificador único
   * @param {string} [email] - Correo electrónico
   * @param {string} [username] - Nombre de usuario
   * @param {string} [name] - Nombre completo
   * @param {Role[]} [roles] - Roles asignados
   * @param {boolean} [isActive] - Estado de activación
   * @param {Permission[]} [permissions] - Permisos específicos
   * @param {string[]} [customPermissions] - Permisos personalizados
   * @param {string} [firstName] - Nombre de pila
   * @param {string} [lastName] - Apellidos
   * @param {boolean} [emailVerified] - Estado de verificación del email
   * @param {string} [phoneNumber] - Número de teléfono
   * @param {Object} [address] - Dirección postal
   * @param {string} [avatarUrl] - URL de la imagen de perfil
   * @param {Date} [lastLoginAt] - Último inicio de sesión
   * @param {Object} [preferences] - Preferencias del usuario
   * @param {Object} [securitySettings] - Configuración de seguridad
   * @param {Date} [passwordChangedAt] - Último cambio de contraseña
   * @param {Date} [birthDate] - Fecha de nacimiento
   * @param {Date} [createdAt] - Fecha de creación
   * @param {Date} [updatedAt] - Fecha de actualización
   * @param {Date} [deletedAt] - Fecha de eliminación lógica
   * @param {Array<Object>} [devices] - Dispositivos registrados
   * @param {string}[passwordHash] - Hash de la contraseña
   */
  constructor(
    public readonly id?: string | undefined | Schema.Types.ObjectId,
    public readonly email?: string,
    public readonly username?: string,
    public readonly name?: string,
    public readonly roles?: Role[],
    public readonly isActive?: boolean,
    public readonly permissions?: Permission[],
    public readonly customPermissions?: string[],
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly emailVerified?: boolean,
    public readonly phoneNumber?: string,
    public readonly address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    },
    public readonly avatarUrl?: string,
    public readonly lastLoginAt?: Date,
    public readonly preferences?: {
      language: string;
      currency: string;
      timezone: string;
      notifications: {
        email: boolean;
        sms: boolean;
        marketing: boolean;
        push: boolean;
      };
    },
    public readonly securitySettings?: {
      mfaEnabled: boolean;
      loginNotifications: boolean;
      passwordChangeRequired: boolean;
      passwordExpiresAt: Date | null;
      securityQuestions: Array<{
        question: string;
        answerHash: string;
      }>;
    },
    public readonly passwordChangedAt?: Date,
    public readonly birthDate?: Date,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly deletedAt?: Date,
    public readonly devices?: Array<{
      deviceId: string;
      platform: string;
      lastLoginAt: Date;
      isTrusted: boolean;
    }>,
    public readonly passwordHash?: string,
  ) {}

  /**
   * Convierte la entidad User a un objeto plano conforme a IUserEntity
   * @public
   * @returns {IUserEntity} Representación plana de la entidad
   */
  public getUserObject(): IUserEntity {
    return {
      id: this.id,
      email: this.email,
      username: this.username,
      name: this.name,
      roles: this.roles,
      isActive: this.isActive,
      permissions: this.permissions,
      customPermissions: this.customPermissions,
      firstName: this.firstName,
      lastName: this.lastName,
      emailVerified: this.emailVerified,
      phoneNumber: this.phoneNumber,
      address: this.address,
      avatarUrl: this.avatarUrl,
      lastLoginAt: this.lastLoginAt,
      preferences: this.preferences,
      securitySettings: this.securitySettings,
      passwordChangedAt: this.passwordChangedAt,
      birthDate: this.birthDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
      devices: this.devices,
      passwordHash: this.passwordHash,
    };
  }

  /**
   * Convierte un array de entidades User a objetos planos
   * @public
   * @param {User[]} users - Array de entidades User
   * @returns {IUserEntity[]} Array de representaciones planas
   */
  public getUserObjects(users: User[]): IUserEntity[] {
    return users.map((user) => user.getUserObject());
  }
}
