import { Permission, Role } from "@libs/common/src/auth/enums/role.enum";
import { IUserEntity } from "./IUser.entity";
import { Schema } from "mongoose";

/**
 * Entidad User del dominio que implementa IUserEntity
 * Modela la representación de un usuario siguiendo el patrón de entidad anémica donde la lógica
 * de negocio se delega a la capa de aplicación. Proporciona transformaciones de datos mediante
 * getUserObject() para instancias individuales y getUserObjects() para colecciones.
 * Todas las propiedades son opcionales permitiendo flexibilidad en la construcción de objetos.
 * @class User
 * @implements {IUserEntity}
 * @module Users/Domain/Entity
 * @description Esta clase representa la entidad de usuario en el dominio de la aplicación.
 * @property {string | undefined} id - Identificador único del usuario
 * @property {string | undefined} email - Correo electrónico del usuario
 * @property {string | undefined} username - Nombre de usuario único
 * @property {string | undefined} name - Nombre completo o de visualización
 * @property {Role[] | undefined} roles - Roles asignados al usuario
 * @property {boolean | undefined} isActive - Estado de activación de la cuenta
 * @property {Permission[] | undefined} permissions - Permisos específicos asignados
 * @property {string[] | undefined} customPermissions - Permisos personalizados no estándar
 * @property {string | undefined} firstName - Nombre de pila
 * @property {string | undefined} lastName - Apellidos
 * @property {boolean | undefined} emailVerified - Estado de verificación del email
 * @property {string | undefined} phoneNumber - Número de teléfono de contacto
 * @property {Object | undefined} address - Dirección postal completa
 * @property {string | undefined} avatarUrl - URL de la imagen de perfil
 * @property {Date | undefined} lastLoginAt - Fecha y hora del último inicio de sesión
 * @property {Object | undefined} preferences - Preferencias configurables del usuario
 * @property {Object | undefined} securitySettings - Configuración de seguridad
 * @property {Date | undefined} passwordChangedAt - Fecha del último cambio de contraseña
 * @property {Date | undefined} birthDate - Fecha de nacimiento
 * @property {Date | undefined} createdAt - Fecha de creación de la cuenta
 * @property {Date | undefined} updatedAt - Fecha de última actualización
 * @property {Date | undefined} deletedAt - Fecha de eliminación lógica
 * @property {Array<Object> | undefined} devices - Dispositivos registrados
 */
export class User implements IUserEntity {
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
  ) {}

  /**
   * Convierte la entidad User a un objeto plano conforme a IUserEntity
   * @returns {IUserEntity} Representación plana de la entidad
   * @public
   * @description Este método transforma la entidad User en un objeto getUserObject || getUserObjects.
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
    };
  }

  /**
   * Convierte un array de entidades User a objetos planos
   * @param {User[]} users - Array de entidades User
   * @returns {IUserEntity[]} Array de representaciones planas
   * @private
   */
  public getUserObjects(users: User[]): IUserEntity[] {
    return users.map((user) => user.getUserObject());
  }
}
