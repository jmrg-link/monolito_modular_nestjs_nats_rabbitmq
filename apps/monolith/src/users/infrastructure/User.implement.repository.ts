/**
 * @file Implementación MongoDB del repositorio de usuarios
 * @module Users/Infrastructure/Repository
 * @description Implementa operaciones de persistencia de usuarios utilizando MongoDB/Mongoose
 */
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, UpdateQuery } from "mongoose";
import {
  User,
  UserAddress,
  UserPreferences,
  UserSecuritySettings,
} from "../domain/User.entity";
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
 * Implementación MongoDB del repositorio de usuarios
 * @class MongoUserRepository
 * @implements {IUserRepository<UserDocument>}
 */
@Injectable()
export class MongoUserRepository
  extends BaseMongoRepository<User, UserDocument>
  implements IUserRepository<UserDocument>
{
  private readonly logger = new Logger(MongoUserRepository.name);

  /**
   * @constructor
   * @param {Model<UserDocument>} userModel - Modelo Mongoose inyectado
   */
  constructor(
    @InjectModel(UserDocument.name)
    private readonly userModel: Model<UserDocument>,
  ) {
    super(userModel, "Usuario");
    this.logger.log("Repositorio de usuarios MongoDB inicializado");
  }

  /**
   * Mapea documento MongoDB a entidad de dominio
   * @param {UserDocument} document - Documento de usuario
   * @returns {User} Entidad de dominio mapeada
   * @protected
   */
  protected mapToDomain(document: UserDocument): User {
    const {
      _id,
      email,
      username,
      name,
      roles,
      isActive,
      permissions,
      customPermissions,
      firstName,
      lastName,
      emailVerified,
      phoneNumber,
      avatarUrl,
      lastLoginAt,
      address,
      preferences,
      passwordChangedAt,
      birthDate,
      deletedAt,
      devices,
      securitySettings,
    } = document;

    let userAddress: UserAddress | undefined;
    if (address) {
      userAddress = new UserAddress(
        address.street,
        address.city,
        address.state,
        address.postalCode,
        address.country,
      );
    }

    const userPreferences = new UserPreferences(
      preferences?.language || "es",
      preferences?.currency || "EUR",
      preferences?.timezone || "Europe/Madrid",
      {
        email: preferences?.notifications?.email ?? true,
        sms: preferences?.notifications?.sms ?? false,
        marketing: preferences?.notifications?.marketing ?? true,
      },
    );

    const userSecuritySettings = new UserSecuritySettings(
      securitySettings?.mfaEnabled ?? false,
      securitySettings?.loginNotifications ?? true,
      securitySettings?.passwordChangeRequired ?? false,
      securitySettings?.passwordExpiresAt || null,
      securitySettings?.securityQuestions || [],
    );

    const userDevices =
      devices?.map((device) => ({
        deviceId: device.deviceId,
        platform: device.platform,
        lastLoginAt: device.lastLoginAt,
        isTrusted: device.isTrusted || false,
      })) || [];

    return new User(
      (_id as unknown as { toString(): string }).toString(),
      email,
      username || email.split("@")[0],
      name,
      roles,
      isActive,
      permissions || [],
      customPermissions || [],
      firstName,
      lastName,
      emailVerified || false,
      phoneNumber,
      userAddress,
      avatarUrl,
      lastLoginAt,
      userPreferences,
      userSecuritySettings,
      passwordChangedAt,
      birthDate,
      new Date(), // createdAt: generado por MongoDB (timestamps:true)
      new Date(), // updatedAt: generado por MongoDB (timestamps:true)
      deletedAt,
      userDevices,
    );
  }

  /**
   * Encuentra usuario por email
   * @param {string} email - Email a buscar
   * @param {boolean} [includePassword=true] - Si incluir campos protegidos
   * @returns {Promise<UserDocument | null>} Documento de usuario o null
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
   * Obtiene usuarios activos con paginación
   * @param {PaginationOptions} options - Opciones de paginación
   * @returns {Promise<PaginatedResult<User>>} Resultado paginado
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
    } as any);
  }

  /**
   * Actualiza contraseña de usuario
   * @param {string} id - ID del usuario
   * @param {string} passwordHash - Hash de la nueva contraseña
   * @returns {Promise<UserDocument | null>} Usuario actualizado o null
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
   * Actualiza estado de activación
   * @param {string} id - ID del usuario
   * @param {boolean} isActive - Nuevo estado
   * @returns {Promise<UserDocument | null>} Usuario actualizado o null
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
   * Busca usuarios por término
   * @param {string} term - Término de búsqueda
   * @param {number} [limit] - Límite de resultados
   * @returns {Promise<UserDocument[]>} Documentos encontrados
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
   * Encuentra usuarios por rol
   * @param {string} role - Rol a buscar
   * @param {PaginationOptions} [options] - Opciones de paginación
   * @returns {Promise<UserDocument[] | PaginatedResult<User>>} Usuarios encontrados
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
   * Actualiza timestamp de último login
   * @param {string} id - ID del usuario
   * @param {Date} timestamp - Fecha y hora del login
   * @param {Partial<Device>} [deviceInfo] - Información del dispositivo
   * @returns {Promise<UserDocument | null>} Usuario actualizado
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
   * Registra intento fallido de login
   * @param {string} email - Email del usuario
   * @param {number} [maxAttempts=10] - Intentos máximos permitidos
   * @param {number} [lockDuration=30] - Duración del bloqueo en minutos
   * @returns {Promise<UserDocument | null>} Usuario actualizado
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
   * Establece token para reset de contraseña
   * @param {string} email - Email del usuario
   * @param {string} token - Token generado
   * @param {number} [expiresIn=180] - Tiempo de expiración en minutos
   * @returns {Promise<UserDocument | null>} Usuario actualizado
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
   * Busca usuario por token de reset
   * @param {string} token - Token a buscar
   * @returns {Promise<UserDocument | null>} Usuario o null
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
   * Establece token para verificación de email
   * @param {string} userId - ID del usuario
   * @param {string} token - Token generado
   * @param {number} [expiresIn=24] - Tiempo de expiración en horas
   * @returns {Promise<UserDocument | null>} Usuario actualizado
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
   * Verifica email con token
   * @param {string} token - Token de verificación
   * @returns {Promise<UserDocument | null>} Usuario verificado o null
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
   * Gestiona permisos de usuario
   * @param {string} userId - ID del usuario
   * @param {Permission[]} permissions - Permisos a gestionar
   * @param {"add" | "remove" | "set"} [action="set"] - Tipo de operación
   * @param {Object} [options] - Opciones adicionales
   * @returns {Promise<UserDocument | null>} Usuario actualizado
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
   * Actualiza roles de usuario
   * @param {string} userId - ID del usuario
   * @param {Role[]} roles - Nuevos roles
   * @param {Object} [options] - Opciones adicionales
   * @returns {Promise<UserDocument | null>} Usuario actualizado
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
   * Elimina lógicamente un usuario
   * @param {string} userId - ID del usuario
   * @param {string} [adminId] - ID del administrador
   * @param {string} [reason] - Motivo de eliminación
   * @param {boolean} [anonymizeData=true] - Si anonimizar datos
   * @returns {Promise<UserDocument | null>} Usuario eliminado
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
   * Restaura usuario eliminado lógicamente
   * @param {string} userId - ID del usuario
   * @param {string} [adminId] - ID del administrador
   * @param {string} [reason] - Motivo de restauración
   * @returns {Promise<UserDocument | null>} Usuario restaurado
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
   * Busca usuarios con un permiso específico
   * @param {Permission} permission - Permiso a buscar
   * @returns {Promise<UserDocument[]>} Lista de usuarios con el permiso
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
   * Obtiene modelo Mongoose subyacente
   * @returns {Model<UserDocument>} Modelo Mongoose
   */
  getUserModel(): Model<UserDocument> {
    return this.userModel;
  }
}
