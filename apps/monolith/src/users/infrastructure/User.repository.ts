/**
 * @file Interfaz del repositorio de usuarios
 * @module Users/Infrastructure/Repository
 * @description Define el contrato para operaciones de persistencia de usuarios
 */
import {
  PaginatedResult,
  PaginationOptions,
} from "@libs/common/src/interfaces/pagination.interface";
import { Permission, Role } from "@libs/common/src/auth/enums/role.enum";
import { User } from "../domain/User.entity";
import { FilterQuery, QueryOptions } from "mongoose";

/**
 * Repositorio de usuarios - Contrato independiente de la implementación
 * @interface IUserRepository
 * @template TUserDto - Tipo del documento de usuario específico de la implementación
 * @template TId - Tipo del identificador único (por defecto string)
 */
export interface IUserRepository<TUserDto = any, TId = string> {
  /**
   * Encuentra un usuario por su identificador único
   * @param {TId} id - Identificador del usuario
   * @returns {Promise<User | null>} Entidad de usuario o null si no existe
   */
  findById(id: TId): Promise<User | null>;

  /**
   * Obtiene todas las entidades que coinciden con los criterios especificados
   * @param {FilterQuery<User>} [filterQuery] - Criterios de filtrado opcionales
   * @param {QueryOptions} [options] - Opciones adicionales para la consulta
   * @returns {Promise<User[]>} Array de entidades que cumplen los criterios
   */
  find(
    filterQuery?: FilterQuery<User>,
    options?: QueryOptions,
  ): Promise<User[]>;

  /**
   * Obtiene un usuario por su correo electrónico
   * @param {string} email - Email del usuario a buscar
   * @param {boolean} [includePassword] - Si debe incluir campos protegidos
   * @returns {Promise<TUserDto | null>} Documento del usuario o null
   */
  findByEmail(
    email: string,
    includePassword?: boolean,
  ): Promise<TUserDto | null>;

  /**
   * Obtiene listado paginado de todos los usuarios
   * @param {PaginationOptions} options - Configuración de paginación
   * @returns {Promise<PaginatedResult<User>>} Resultado paginado con entidades de dominio
   */
  findWithPagination(
    options: PaginationOptions,
  ): Promise<PaginatedResult<User>>;

  /**
   * Obtiene listado paginado filtrando solo usuarios activos
   * @param {PaginationOptions} options - Configuración de paginación
   * @returns {Promise<PaginatedResult<User>>} Resultado paginado con usuarios activos
   */
  findActiveUsersWithPagination(
    options: PaginationOptions,
  ): Promise<PaginatedResult<User>>;

  /**
   * Persiste un nuevo usuario en el almacenamiento
   * @param {Partial<User>} userData - Datos del usuario a crear
   * @returns {Promise<User>} Entidad de usuario creada
   */
  create(userData: Partial<User>): Promise<User>;

  /**
   * Actualiza un usuario existente
   * @param {TId} id - Identificador del usuario
   * @param {Partial<User>} updateData - Datos a actualizar
   * @returns {Promise<User | null>} Usuario actualizado o null
   */
  update(id: TId, updateData: Partial<User>): Promise<User | null>;

  /**
   * Actualiza la contraseña de un usuario
   * @param {TId} id - ID del usuario
   * @param {string} passwordHash - Hash de la nueva contraseña
   * @returns {Promise<TUserDto | null>} Usuario actualizado o null
   */
  updatePassword(id: TId, passwordHash: string): Promise<TUserDto | null>;

  /**
   * Actualiza el estado de activación de un usuario
   * @param {TId} id - ID del usuario a actualizar
   * @param {boolean} isActive - Nuevo estado de activación
   * @returns {Promise<TUserDto | null>} Usuario actualizado o null
   */
  updateActiveStatus(id: TId, isActive: boolean): Promise<TUserDto | null>;

  /**
   * Busca usuarios por texto en campos relevantes
   * @param {string} term - Término de búsqueda
   * @param {number} [limit] - Límite de resultados
   * @returns {Promise<TUserDto[]>} Lista de usuarios coincidentes
   */
  searchByTerm(term: string, limit?: number): Promise<TUserDto[]>;

  /**
   * Obtiene usuarios con un rol específico
   * @param {string} role - Rol a buscar
   * @param {PaginationOptions} [options] - Configuración de paginación
   * @returns {Promise<TUserDto[] | PaginatedResult<User>>} Usuarios con el rol
   */
  findByRole(
    role: string,
    options?: PaginationOptions,
  ): Promise<TUserDto[] | PaginatedResult<User>>;

  /**
   * Obtiene usuarios con un permiso específico
   * @param {Permission} permission - Permiso a buscar
   * @returns {Promise<TUserDto[]>} Lista de usuarios con el permiso
   */
  findByPermission(permission: Permission): Promise<TUserDto[]>;

  /**
   * Actualiza timestamp y dispositivo del último inicio de sesión
   * @param {TId} id - ID del usuario
   * @param {Date} timestamp - Fecha del inicio de sesión
   * @param {any} [deviceInfo] - Información del dispositivo
   * @returns {Promise<TUserDto | null>} Usuario actualizado
   */
  updateLastLoginTimestamp(
    id: TId,
    timestamp: Date,
    deviceInfo?: any,
  ): Promise<TUserDto | null>;

  /**
   * Registra un intento fallido de inicio de sesión
   * @param {string} email - Email del usuario
   * @param {number} [maxAttempts] - Intentos máximos permitidos
   * @param {number} [lockDuration] - Duración del bloqueo en minutos
   * @returns {Promise<TUserDto | null>} Usuario actualizado
   */
  registerFailedLoginAttempt(
    email: string,
    maxAttempts?: number,
    lockDuration?: number,
  ): Promise<TUserDto | null>;

  /**
   * Establece token para operación de restablecimiento de contraseña
   * @param {string} email - Email del usuario que solicita restablecer contraseña
   * @param {string} token - Token único generado para la operación
   * @param {number} [expiresIn] - Tiempo de expiración en minutos
   * @returns {Promise<TUserDto | null>} Usuario actualizado
   */
  setPasswordResetToken(
    email: string,
    token: string,
    expiresIn?: number,
  ): Promise<TUserDto | null>;

  /**
   * Busca usuario por token de restablecimiento de contraseña
   * @param {string} token - Token a buscar
   * @returns {Promise<TUserDto | null>} Usuario o null si token inválido/expirado
   */
  findByResetToken(token: string): Promise<TUserDto | null>;

  /**
   * Establece token para verificación de email
   * @param {TId} userId - ID del usuario
   * @param {string} token - Token único generado para verificación
   * @param {number} [expiresIn] - Tiempo de expiración en horas
   * @returns {Promise<TUserDto | null>} Usuario actualizado
   */
  setEmailVerificationToken(
    userId: TId,
    token: string,
    expiresIn?: number,
  ): Promise<TUserDto | null>;

  /**
   * Verifica email de usuario usando token de verificación
   * @param {string} token - Token de verificación
   * @returns {Promise<TUserDto | null>} Usuario verificado o null si token inválido
   */
  verifyEmail(token: string): Promise<TUserDto | null>;

  /**
   * Gestiona permisos de un usuario (añadir/eliminar/establecer)
   * @param {TId} userId - ID del usuario
   * @param {Permission[]} permissions - Permisos a gestionar
   * @param {"add" | "remove" | "set"} [action] - Tipo de operación
   * @param {any} [options] - Opciones adicionales
   * @returns {Promise<TUserDto | null>} Usuario actualizado
   */
  setPermissions(
    userId: TId,
    permissions: Permission[],
    action?: "add" | "remove" | "set",
    options?: any,
  ): Promise<TUserDto | null>;

  /**
   * Actualiza roles asignados a un usuario
   * @param {TId} userId - ID del usuario
   * @param {Role[]} roles - Roles a asignar
   * @param {any} [options] - Opciones adicionales
   * @returns {Promise<TUserDto | null>} Usuario actualizado
   */
  updateRoles(
    userId: TId,
    roles: Role[],
    options?: any,
  ): Promise<TUserDto | null>;

  /**
   * Realiza eliminación lógica de un usuario
   * @param {TId} userId - ID del usuario
   * @param {string} [adminId] - ID del administrador
   * @param {string} [reason] - Motivo de la eliminación
   * @param {boolean} [anonymizeData] - Si anonimizar datos personales
   * @returns {Promise<TUserDto | null>} Usuario eliminado lógicamente
   */
  softDelete(
    userId: TId,
    adminId?: string,
    reason?: string,
    anonymizeData?: boolean,
  ): Promise<TUserDto | null>;

  /**
   * Restaura usuario previamente eliminado de forma lógica
   * @param {TId} userId - ID del usuario
   * @param {string} [adminId] - ID del administrador
   * @param {string} [reason] - Motivo de la restauración
   * @returns {Promise<TUserDto | null>} Usuario restaurado
   */
  restoreUser(
    userId: TId,
    adminId?: string,
    reason?: string,
  ): Promise<TUserDto | null>;

  /**
   * Elimina usuario permanentemente
   * @param {TId} id - Identificador del usuario
   * @returns {Promise<User | null>} Usuario eliminado o null
   */
  delete(id: TId): Promise<User | null>;
}
