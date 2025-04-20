/**
 * @fileoverview Implementación MongoDB del repositorio de usuarios
 * @module Users/Infrastructure/Repository
 * @description Implementa el patrón Repository para la persistencia de usuarios utilizando MongoDB y Mongoose.
 * Esta clase actúa como puente entre la capa de dominio y la base de datos,
 * proporcionando operaciones CRUD y búsquedas especializadas para la entidad User.
 */

import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, UpdateQuery } from "mongoose";
import { User } from "../domain/User.entity";
import { IUserEntity } from "../domain/IUser.entity";
import { UserDocument, Device } from "./User.schema";
import { BaseMongoRepository } from "@libs/common/src/database/base.repository";
import {
  PaginatedResult,
  PaginationOptions,
} from "@libs/common/src/interfaces/pagination.interface";
import {
  Permission,
  Role,
  RolePermissions,
} from "@libs/common/src/auth/enums/role.enum";
import { IUserRepository } from "./User.repository";

/**
 * @class MongoUserRepository - User.implement.repository.ts
 * @extends {BaseMongoRepository<User, UserDocument>}
 * @implements {IUserRepository<UserDocument>}
 * @private readonly logger - Logger para registrar eventos y errores
 * @description Implementación concreta del repositorio de usuarios para MongoDB.
 * Extiende BaseMongoRepository para heredar operaciones comunes y
 * implementa IUserRepository para cumplir con el contrato de la interfaz.
 * Maneja la conversión entre documentos MongoDB y entidades de dominio.
 */
@Injectable()
export class MongoUserRepository
  extends BaseMongoRepository<User, UserDocument>
  implements IUserRepository<UserDocument>{
  private readonly logger = new Logger(MongoUserRepository.name);

  /**
   * @constructor
   * @inject {InjectModel(UserDocument.name)}
   * @param {Model<UserDocument>} userModel - Modelo Mongoose inyectado para operaciones de base de datos
   * @description Inyecta el modelo Mongoose para la entidad User.
   */
  constructor(
    @InjectModel(UserDocument.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    super(userModel, "users");
    this.logger.log("Repositorio de usuarios MongoDB inicializado");
  }

  /**
   * Transforma un documento MongoDB en una entidad de dominio User
   * @protected
   * @param {UserDocument} document - Documento de usuario recuperado de MongoDB
   * @returns {User} Entidad de dominio User con estructura compatible con IUserEntity
   */
  protected mapToDomain(document: UserDocument): User {
    const userEntity: IUserEntity = {
      id: (document._id as unknown as { toString(): string }).toString(),
      email: document.email,
      username: document.username || document.email.split("@")[0],
      name: document.name,
      roles: document.roles,
      isActive: document.isActive,
      permissions: document.permissions || [],
      customPermissions: document.customPermissions || [],
      firstName: document.firstName,
      lastName: document.lastName,
      emailVerified: document.emailVerified || false,
      phoneNumber: document.phoneNumber,
      address: document.address ? {
        street: document.address.street,
        city: document.address.city,
        state: document.address.state,
        postalCode: document.address.postalCode,
        country: document.address.country,
      } : undefined,
      avatarUrl: document.avatarUrl,
      lastLoginAt: document.lastLoginAt,
      preferences: {
        language: document.preferences?.language || "es",
        currency: document.preferences?.currency || "EUR",
        timezone: document.preferences?.timezone || "Europe/Madrid",
        notifications: {
          email: document.preferences?.notifications?.email ?? true,
          sms: document.preferences?.notifications?.sms ?? false,
          marketing: document.preferences?.notifications?.marketing ?? true,
        },
      },
      securitySettings: {
        mfaEnabled: document.securitySettings?.mfaEnabled ?? false,
        loginNotifications: document.securitySettings?.loginNotifications ?? true,
        passwordChangeRequired: document.securitySettings?.passwordChangeRequired ?? false,
        passwordExpiresAt: document.securitySettings?.passwordExpiresAt || null,
        securityQuestions: document.securitySettings?.securityQuestions || [],
      },
      passwordChangedAt: document.passwordChangedAt,
      birthDate: document.birthDate,
      deletedAt: document.deletedAt,
      devices: document.devices?.map((device) => ({
        deviceId: device.deviceId,
        platform: device.platform,
        lastLoginAt: device.lastLoginAt,
        isTrusted: device.isTrusted || false,
      })) || [],
    };

    return new User(
      userEntity.id,
      userEntity.email,
      userEntity.username,
      userEntity.name,
      userEntity.roles,
      userEntity.isActive,
      userEntity.permissions,
      userEntity.customPermissions,
      userEntity.firstName,
      userEntity.lastName,
      userEntity.emailVerified,
      userEntity.phoneNumber,
      userEntity.address,
      userEntity.avatarUrl,
      userEntity.lastLoginAt,
      userEntity.preferences,
      userEntity.securitySettings,
      userEntity.passwordChangedAt,
      userEntity.birthDate,
      userEntity.createdAt,
      userEntity.updatedAt,
      userEntity.deletedAt,
      userEntity.devices,
    );
  }

  /**
   * @public
   * @param {string} email - Email a buscar
   * @param {boolean} [includePassword=true] - Incluir campos sensibles como passwordHash
   * @returns {Promise<UserDocument | null>} Documento de usuario o null si no existe
   * @description Busca un usuario por su dirección de correo electrónico y opcionalmente incluye campos sensibles.
   */
  async findByEmail(
    email: string,
    includePassword = true,
  ): Promise<UserDocument | null> {
    this.logger.debug(`Buscando usuario con email: ${email}`);
    const query = this.userModel.findOne({
      email: email.toLowerCase().trim(),
      deletedAt: { $exists: false },
    });

    if (includePassword) {
      query.select("+passwordHash +refreshToken");
    }

    const result = await query.exec();
    this.logger.debug(
      `Resultado de búsqueda por email:`,
      result ? "Usuario encontrado" : "Usuario no encontrado",
    );

    return result;
  }

  /**
   * @public
   * @param {PaginationOptions} options - Opciones de paginación (página, límite, orden)
   * @returns {Promise<PaginatedResult<User>>} Resultado paginado con entidades de dominio
   * @description Obtiene una lista paginada de usuarios activos y no eliminados que cumplen con los criterios de búsqueda que son pasados como argumento.
   */
  async findActiveUsersWithPagination(
    options: PaginationOptions,
  ): Promise<PaginatedResult<User>> {
    this.logger.debug(
      `Buscando usuarios activos con paginación: ${JSON.stringify(options)}`,
    );

    return this.findWithPagination(options, {
      isActive: true,
      deletedAt: { $exists: false },
    } as FilterQuery<UserDocument>);
  }

  /**
   * @public
   * @param {string} id - ID del usuario
   * @param {string} passwordHash - Hash de la nueva contraseña
   * @returns {Promise<UserDocument | null>} Usuario actualizado o null si no existe
   * @description Actualiza la contraseña de un usuario y restablece el token de restablecimiento.
   */
  async updatePassword(
    id: string,
    passwordHash: string,
  ): Promise<UserDocument | null> {
    this.logger.debug(`Actualizando contraseña para usuario ${id}`);

    return this.userModel
      .findByIdAndUpdate(
        id,
        {
          passwordHash,
          passwordChangedAt: new Date(),
          $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * @public
   * @param {string} id - ID del usuario
   * @param {boolean} isActive - Nuevo estado de activación
   * @returns {Promise<UserDocument | null>} Usuario actualizado o null si no existe
   * @description Actualiza el estado de activación de un usuario pasando su ID y el nuevo estado boolean como argumentos.
   */
  async updateActiveStatus(
    id: string,
    isActive: boolean,
  ): Promise<UserDocument | null> {
    this.logger.debug(
      `Actualizando estado activo para usuario ${id}: ${isActive}`,
    );

    return this.userModel
      .findByIdAndUpdate(id, { isActive }, { new: true })
      .exec();
  }

  /**
   * @public
   * @param {string} term - Término de búsqueda
   * @param {number} [limit] - Límite de resultados
   * @returns {Promise<UserDocument[]>} Lista de documentos que coinciden con la búsqueda
   * @description Busca usuarios que coincidan con un término en varios campos (email, nombre, etc.) y opcionalmente limita el número de resultados.
   * Si el término tiene más de 3 caracteres, se utiliza una búsqueda de texto completo.
   * Si no, se utiliza una búsqueda regex en los campos especificados.
   */
  async searchByTerm(term: string, limit?: number): Promise<UserDocument[]> {
    this.logger.debug(`Buscando usuarios con término: ${term}`);
    if (term.length > 3) {
      const query = this.userModel
        .find(
          { $text: { $search: term }, deletedAt: { $exists: false } },
          { score: { $meta: "textScore" } },
        )
        .sort({ score: { $meta: "textScore" } });
      if (limit) {
        query.limit(limit);
      }

      return query.exec();
    }

    const regex = new RegExp(term, "i");
    const query = this.userModel.find({
      $and: [
        { deletedAt: { $exists: false } },
        {
          $or: [
            { name: { $regex: regex } },
            { email: { $regex: regex } },
            { firstName: { $regex: regex } },
            { lastName: { $regex: regex } },
          ],
        },
      ],
    });
    if (limit) {
      query.limit(limit);
    }

    return query.exec();
  }

  /**
   * @public
   * @param {string} role - Rol a buscar
   * @param {PaginationOptions} [options] - Opciones de paginación
   * @returns {Promise<UserDocument[] | PaginatedResult<User>>} Lista de usuarios con el rol o resultado paginado
   * @description Busca usuarios que tengan un rol específico y opcionalmente aplica paginación.
   * Si se proporcionan opciones de paginación, se devuelve un resultado paginado.
   * Si no, se devuelve una lista de documentos de usuario.
   */
  async findByRole(
    role: string,
    options?: PaginationOptions,
  ): Promise<UserDocument[] | PaginatedResult<User>> {
    this.logger.debug(`Buscando usuarios con rol: ${role}`);
    const query: FilterQuery<UserDocument> = {
      roles: role,
      deletedAt: { $exists: false },
    };
    if (options) {
      return this.findWithPagination(options, query as any);
    }

    return this.userModel.find(query).exec();
  }

  /**
   * @public
   * @param {string} id - ID del usuario
   * @param {Date} timestamp - Fecha y hora del login
   * @param {Partial<Device>} [deviceInfo] - Información del dispositivo desde el que se inició sesión
   * @returns {Promise<UserDocument | null>} Usuario actualizado o null si no existe
   * @description Actualiza el timestamp del último inicio de sesión y opcionalmente la información del dispositivo del usuario.
   * @throws {NotFoundException} Si el usuario no existe
   */
  async updateLastLoginTimestamp(
    id: string,
    timestamp: Date,
    deviceInfo?: Partial<Device>,
  ): Promise<UserDocument | null> {
    this.logger.debug(`Actualizando timestamp de login para usuario ${id}`);
    const updateQuery: UpdateQuery<UserDocument> = {
      lastLoginAt: timestamp,
      failedLoginAttempts: 0,
      $unset: { accountLockedUntil: 1 },
    };

    if (deviceInfo && deviceInfo.deviceId) {
      const device: Device = {
        deviceId: deviceInfo.deviceId,
        platform: deviceInfo.platform || "unknown",
        lastLoginAt: timestamp,
        deviceName: deviceInfo.deviceName,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        isTrusted: deviceInfo.isTrusted || false,
        lastLocation: deviceInfo.lastLocation,
      };

      const user = await this.userModel.findById(id).exec();
      if (!user) {
        throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
      }
      const existingDeviceIndex = user.devices.findIndex(
        (d) => d.deviceId === device.deviceId,
      );
      if (existingDeviceIndex >= 0) {
        updateQuery[`devices.${existingDeviceIndex}`] = device;
      } else {
        updateQuery.$push = { devices: device };
      }
    }

    return this.userModel
      .findByIdAndUpdate(id, updateQuery, { new: true })
      .exec();
  }

  /**
   * @public
   * @param {string} email - Email del usuario
   * @param {number} [maxAttempts=10] - Número máximo de intentos permitidos
   * @param {number} [lockDuration=30] - Duración del bloqueo en minutos
   * @returns {Promise<UserDocument | null>} Usuario actualizado con información de intentos fallidos
   * @description Registra un intento fallido de inicio de sesión y bloquea la cuenta si se exceden los intentos máximos 10 intentos por cada 30 minutos.
   */
  async registerFailedLoginAttempt(
    email: string,
    maxAttempts = 10,
    lockDuration = 30,
  ): Promise<UserDocument | null> {
    this.logger.debug(`Registrando intento fallido de login para ${email}`);

    const user = await this.findByEmail(email, false);
    if (!user) return null;

    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    const updateData: any = { failedLoginAttempts: failedAttempts };
    if (failedAttempts >= maxAttempts) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + lockDuration);
      updateData.accountLockedUntil = lockUntil;
      this.logger.warn(
        `Cuenta ${email} bloqueada hasta ${lockUntil} por exceder intentos fallidos`,
      );
    }

    return this.userModel
      .findOneAndUpdate({ email }, updateData, { new: true })
      .exec();
  }

  /**
   * @public
   * @param {string} email - Email del usuario
   * @param {string} token - Token generado para el restablecimiento
   * @param {number} [expiresIn=180] - Tiempo de expiración en minutos
   * @returns {Promise<UserDocument | null>} Usuario actualizado con token de reset
   * @description Establece un token temporal para el restablecimiento de contraseña y lo asocia al usuario especificado por su email.
   */
  async setPasswordResetToken(
    email: string,
    token: string,
    expiresIn = 180,
  ): Promise<UserDocument | null> {
    this.logger.debug(`Estableciendo token de reset para ${email}`);

    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + expiresIn);

    return this.userModel
      .findOneAndUpdate(
        { email, isActive: true, deletedAt: { $exists: false } },
        {
          passwordResetToken: token,
          passwordResetExpires: expires,
        },
        { new: true },
      )
      .exec();
  }

  /**
   * @public
   * @param {string} token - Token de restablecimiento a buscar
   * @returns {Promise<UserDocument | null>} Usuario encontrado o null si el token no es válido o expiró
   * @description Busca un usuario utilizando un token de restablecimiento de contraseña y verifica su validez y expiración.
   * Si el token es válido y no ha expirado, se devuelve el usuario correspondiente.
   * Si no, se devuelve null.
   */
  async findByResetToken(token: string): Promise<UserDocument | null> {
    this.logger.debug(`Buscando usuario por token de reset`);

    return this.userModel
      .findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
        isActive: true,
        deletedAt: { $exists: false },
      })
      .exec();
  }

  /**
   * @public
   * @param {string} userId - ID del usuario
   * @param {string} token - Token generado para la verificación
   * @param {number} [expiresIn=24] - Tiempo de expiración en horas
   * @returns {Promise<UserDocument | null>} Usuario actualizado con token de verificación
   * @description Establece un token temporal para la verificación de email y lo asocia al usuario especificado por su ID.
   * El token tiene un tiempo de expiración configurable en horas.
   */
  async setEmailVerificationToken(
    userId: string,
    token: string,
    expiresIn = 24,
  ): Promise<UserDocument | null> {
    this.logger.debug(`Estableciendo token de verificación para ${userId}`);

    const expires = new Date();
    expires.setHours(expires.getHours() + expiresIn);

    return this.userModel
      .findByIdAndUpdate(
        userId,
        {
          emailVerificationToken: token,
          emailVerificationExpires: expires,
        },
        { new: true },
      )
      .exec();
  }

  /**
   * @public
   * @param {string} token - Token de verificación
   * @returns {Promise<UserDocument | null>} Usuario verificado o null si el token no es válido
   * @description Verifica el email de un usuario utilizando un token de verificación y lo actualiza en la base de datos.
   * Si el token es válido y no ha expirado, se actualiza el estado de verificación del email.
   * Si no, se devuelve null.
   */
  async verifyEmail(token: string): Promise<UserDocument | null> {
    this.logger.debug(`Verificando email con token`);

    return this.userModel
      .findOneAndUpdate(
        {
          emailVerificationToken: token,
          emailVerificationExpires: { $gt: new Date() },
          isActive: true,
        },
        {
          emailVerified: true,
          $unset: {
            emailVerificationToken: 1,
            emailVerificationExpires: 1,
          },
        },
        { new: true },
      )
      .exec();
  }

  /**
   * @public
   * @param {string} userId - ID del usuario
   * @param {Permission[]} permissions - Permisos a gestionar
   * @param {"add" | "remove" | "set"} [action="set"] - Acción a realizar (agregar, eliminar o establecer)
   * @param {Object} [options] - Opciones adicionales para la operación
   * @returns {Promise<UserDocument | null>} Usuario actualizado con nuevos permisos
   * @description Establece, añade o elimina permisos para un usuario específico.
   * Permite agregar permisos a un usuario, eliminarlos o establecer un nuevo conjunto de permisos.
   * También permite agregar entradas al registro de auditoría y personalizar permisos.
   */
  async setPermissions(
    userId: string,
    permissions: Permission[],
    action: "add" | "remove" | "set" = "set",
    options: {
      addToAuditLog?: boolean;
      performedBy?: string;
      customPermissions?: string[];
    } = {},
  ): Promise<UserDocument | null> {
    this.logger.debug(
      `${action === "set" ? "Estableciendo" : action === "add" ? "Añadiendo" : "Eliminando"} permisos para usuario ${userId}`,
    );

    const validPermissions = permissions.filter((p) =>
      Object.values(Permission).includes(p),
    );
    if (validPermissions.length !== permissions.length) {
      this.logger.warn(
        `Se encontraron permisos no válidos al configurar permisos para ${userId}`,
      );
    }

    const updateQuery: Record<string, unknown> = {};
    switch (action) {
      case "add":
        updateQuery.$addToSet = { permissions: { $each: validPermissions } };
        break;
      case "remove":
        updateQuery.$pull = { permissions: { $in: validPermissions } };
        break;
      case "set":
      default:
        updateQuery.permissions = validPermissions;
        break;
    }

    if (options.customPermissions !== undefined) {
      switch (action) {
        case "add":
          if (!updateQuery.$addToSet) updateQuery.$addToSet = {};
          updateQuery.$addToSet = {
            ...(updateQuery.$addToSet as Record<string, unknown>),
            customPermissions: { $each: options.customPermissions },
          };
          break;
        case "remove":
          if (!updateQuery.$pull) updateQuery.$pull = {};
          updateQuery.$pull = {
            ...(updateQuery.$pull as Record<string, unknown>),
            customPermissions: { $in: options.customPermissions },
          };
          break;
        case "set":
        default:
          updateQuery.customPermissions = options.customPermissions;
          break;
      }
    }

    if (options.addToAuditLog && options.performedBy) {
      const auditEntry = {
        action: `permissions.${action}`,
        performedBy: options.performedBy,
        timestamp: new Date(),
        details: { permissions: validPermissions },
      };

      if (!updateQuery.$push) updateQuery.$push = {};
      updateQuery.$push = {
        ...(updateQuery.$push as Record<string, unknown>),
        auditLog: auditEntry,
      };
    }

    return this.userModel
      .findByIdAndUpdate(userId, updateQuery, { new: true })
      .exec();
  }

  /**
   * @public
   * @param {string} userId - ID del usuario
   * @param {Role[]} roles - Nuevos roles a asignar
   * @param {Object} [options] - Opciones para el proceso de actualización
   * @param {boolean} [options.managePermissions=true] - Si se deben gestionar los permisos asociados a los roles
   * @param {string} [options.performedBy] - ID del administrador que realiza la acción
   * @param {string} [options.reason] - Motivo de la actualización
   * @param {boolean} [options.preserveCustomPermissions=true] - Si se deben conservar los permisos personalizados
   * @returns {Promise<UserDocument | null>} Usuario actualizado con nuevos roles y permisos
   * @description Actualiza los roles de un usuario y opcionalmente ajusta los permisos asociados a esos roles.
   * Permite agregar entradas al registro de auditoría y personalizar permisos.
   */
  async updateRoles(
    userId: string,
    roles: Role[],
    options: {
      managePermissions?: boolean;
      performedBy?: string;
      reason?: string;
      preserveCustomPermissions?: boolean;
    } = {},
  ): Promise<UserDocument | null> {
    const {
      managePermissions = true,
      performedBy,
      reason,
      preserveCustomPermissions = true,
    } = options;

    this.logger.debug(
      `Actualizando roles para usuario ${userId}: ${roles.join(", ")}`,
    );

    const validRoles = roles.filter((r) => Object.values(Role).includes(r));
    if (validRoles.length !== roles.length) {
      this.logger.warn(
        `Se encontraron roles no válidos al actualizar roles para ${userId}`,
      );
    }

    const updateQuery: Record<string, unknown> = { roles: validRoles };
    if (performedBy) {
      const auditEntry = {
        action: "roles.update",
        performedBy,
        timestamp: new Date(),
        details: {
          roles: validRoles,
          reason: reason || "Actualización de roles",
        },
      };

      updateQuery.$push = { auditLog: auditEntry };
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateQuery, { new: true })
      .exec();

    if (!updatedUser || !managePermissions) return updatedUser;

    const permissions = new Set<Permission>();
    for (const role of validRoles) {
      if (RolePermissions[role]) {
        for (const permission of RolePermissions[role]) {
          permissions.add(permission);
        }
      }
    }

    let customPermissions: string[] | undefined;
    if (preserveCustomPermissions) {
      if (validRoles.includes(Role.CUSTOM) && updatedUser.permissions?.length) {
        for (const permission of updatedUser.permissions) {
          permissions.add(permission as Permission);
        }
      }

      if (updatedUser.customPermissions?.length) {
        customPermissions = updatedUser.customPermissions;
      }
    }

    return this.setPermissions(userId, Array.from(permissions), "set", {
      addToAuditLog: !!performedBy,
      performedBy,
      customPermissions,
    });
  }

  /**
   * @public
   * @param {string} userId - ID del usuario a eliminar
   * @param {string} [adminId] - ID del administrador que realiza la eliminación
   * @param {string} [reason] - Motivo de la eliminación
   * @param {boolean} [anonymizeData=true] - Si se deben anonimizar los datos personales
   * @returns {Promise<UserDocument | null>} Usuario eliminado lógicamente
   * @description Realiza una eliminación lógica de un usuario (soft delete) el usuario se marca como inactivo y se registra la fecha de eliminación.
   * También se pueden eliminar datos sensibles y registrar la acción en el registro de auditoría.
   */
  async softDelete(
    userId: string,
    adminId?: string,
    reason?: string,
    anonymizeData = true,
  ): Promise<UserDocument | null> {
    this.logger.debug(
      `Eliminación lógica de usuario ${userId}${adminId ? ` por admin ${adminId}` : ""}`,
    );

    const updateData: Record<string, unknown> = {
      deletedAt: new Date(),
      isActive: false,
      refreshToken: null,
    };

    if (adminId) {
      updateData.deletedBy = adminId;
      updateData.$push = {
        auditLog: {
          action: "user.delete",
          performedBy: adminId,
          timestamp: new Date(),
          details: { reason: reason || "No se proporcionó motivo" },
        },
      };
    }

    if (anonymizeData) {
      const timestamp = Date.now();
      updateData.email = `deleted_${timestamp}_${userId}@deleted.com`;
      updateData.username = `deleted_${timestamp}`;
      updateData.name = `Usuario Eliminado ${timestamp}`;
      updateData.firstName = null;
      updateData.lastName = null;
      updateData.phoneNumber = null;
      updateData.avatarUrl = null;
      updateData.passwordHash = "DELETED";
      updateData.$unset = {
        emailVerificationToken: "",
        passwordResetToken: "",
        billingInfo: "",
        address: "",
      };
    }

    return this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .exec();
  }

  /**
   * @public
   * @param {string} userId - ID del usuario a restaurar
   * @param {string} [adminId] - ID del administrador que realiza la restauración
   * @param {string} [reason] - Motivo de la restauración
   * @returns {Promise<UserDocument | null>} Usuario restaurado o null si no existe
   * @description Restaura un usuario que fue eliminado lógicamente (soft delete) y elimina la fecha de eliminación.
   * También se pueden registrar la acción en el registro de auditoría.
   * Si el usuario fue eliminado y sus datos fueron anonimizados, se devuelve null.
   */
  async restoreUser(
    userId: string,
    adminId?: string,
    reason?: string,
  ): Promise<UserDocument | null> {
    this.logger.debug(`Restaurando usuario eliminado ${userId}`);
    const user = await this.userModel
      .findOne({
        _id: userId,
        deletedAt: { $exists: true },
      })
      .exec();

    if (!user) {
      return null;
    }

    if (user.email.startsWith("deleted_")) {
      this.logger.warn(
        `No se puede restaurar completamente el usuario ${userId} porque los datos fueron anonimizados`,
      );
    }

    const updateData: any = {
      $unset: { deletedAt: "", deletedBy: "" },
      isActive: true,
    };

    if (adminId) {
      updateData.$push = {
        auditLog: {
          action: "user.restore",
          performedBy: adminId,
          timestamp: new Date(),
          details: { reason: reason || "No se proporcionó motivo" },
        },
      };
    }

    return this.userModel
      .findByIdAndUpdate(userId, updateData, { new: true })
      .exec();
  }

  /**
   * @public
   * @param {Permission} permission - Permiso a buscar
   * @returns {Promise<UserDocument[]>} Lista de usuarios que tienen el permiso
   * @description Busca usuarios que tengan un permiso específico y que estén activos.
   * También se excluyen los usuarios eliminados.
   */
  async findByPermission(permission: Permission): Promise<UserDocument[]> {
    this.logger.debug(`Buscando usuarios con permiso: ${permission}`);

    return this.userModel
      .find({
        $or: [{ permissions: permission }, { roles: Role.ADMIN }],
        isActive: true,
        deletedAt: { $exists: false },
      })
      .exec();
  }

  /**
   * @public
   * @returns {Model<UserDocument>} Modelo Mongoose de User
   * @description Obtiene el modelo Mongoose subyacente para operaciones directas en la base de datos.
   * Esto puede ser útil para operaciones avanzadas o personalizadas que no están cubiertas por el repositorio.
   * **IMPORTANTE** Utilizar con precaución, ya que se omiten las validaciones y transformaciones del repositorio y la capa de dominio.
   */
  getUserModel(): Model<UserDocument> {
    return this.userModel;
  }
}