/**
 * @file Definiciones de roles y permisos del sistema
 * @module Auth/Enums
 * @description Define la estructura de control de acceso basado en roles (RBAC)
 */

/**
 * @file role.enum.ts
 * @enum {string}
 * @property {string} DEFAULT - Rol por defecto para usuarios regulares
 * @property {string} CUSTOM - Rol personalizado para usuarios con permisos específicos
 * @property {string} STAFF - Rol para personal interno con permisos limitados
 * @property {string} ADMIN - Rol de administrador con todos los permisos
 * @description Define los roles disponibles en el sistema
 */
export enum Role {
  DEFAULT = "default",
  CUSTOM = "custom",
  STAFF = "staff",
  ADMIN = "admin",
}

/**
 * @file role.enum.ts
 * @enum {string}
 * @property {string} READ_USERS - Permiso para leer información de usuarios
 * @property {string} CREATE_USER - Permiso para crear nuevos usuarios
 * @property {string} UPDATE_USER - Permiso para actualizar información de usuarios
 * @property {string} DELETE_USER - Permiso para eliminar usuarios
 * @property {string} READ_PRODUCTS - Permiso para leer información de productos
 * @property {string} CREATE_PRODUCT - Permiso para crear nuevos productos
 * @property {string} UPDATE_PRODUCT - Permiso para actualizar información de productos
 * @property {string} DELETE_PRODUCT - Permiso para eliminar productos
 * @property {string} READ_ORDERS - Permiso para leer información de órdenes
 * @property {string} CREATE_ORDER - Permiso para crear nuevas órdenes
 * @property {string} UPDATE_ORDER - Permiso para actualizar información de órdenes
 * @property {string} DELETE_ORDER - Permiso para eliminar órdenes
 * @property {string} MARK_ORDER_PAID - Permiso para marcar órdenes como pagadas
 * @property {string} READ_PROFILE - Permiso para leer el perfil del usuario
 * @property {string} UPDATE_PROFILE - Permiso para actualizar el perfil del usuario
 * @property {string} MANAGE_ROLES - Permiso para gestionar roles y permisos
 * @property {string} VIEW_METRICS - Permiso para ver métricas del sistema
 * @property {string} MANAGE_SETTINGS - Permiso para gestionar configuraciones del sistema
 * @description Define los permisos disponibles en el sistema
 * @description Define los permisos específicos que pueden ser asignados a los roles
 */
export enum Permission {
  // Permisos para usuarios
  READ_USERS = "read:users",
  CREATE_USER = "create:user",
  UPDATE_USER = "update:user",
  DELETE_USER = "delete:user",

  // Permisos para productos
  READ_PRODUCTS = "read:products",
  CREATE_PRODUCT = "create:product",
  UPDATE_PRODUCT = "update:product",
  DELETE_PRODUCT = "delete:product",

  // Permisos para órdenes
  READ_ORDERS = "read:orders",
  CREATE_ORDER = "create:order",
  UPDATE_ORDER = "update:order",
  DELETE_ORDER = "delete:order",
  MARK_ORDER_PAID = "mark:order:paid",

  // Permisos para su propio usuario
  READ_PROFILE = "read:profile",
  UPDATE_PROFILE = "update:profile",

  // Permisos de sistema
  MANAGE_ROLES = "manage:roles",
  VIEW_METRICS = "view:metrics",
  MANAGE_SETTINGS = "manage:settings",
}

/**
 * Mapa de permisos asignados a cada rol en el sistema
 * @type {Record<Role, Permission[]>}
 * @description Define la estructura jerárquica de permisos por rol
 */
export const RolePermissions: Record<Role, Permission[]> = {
  [Role.DEFAULT]: [
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    Permission.READ_PRODUCTS,
    Permission.CREATE_ORDER,
  ],

  [Role.CUSTOM]: [],

  [Role.STAFF]: [
    Permission.READ_PROFILE,
    Permission.UPDATE_PROFILE,
    Permission.READ_PRODUCTS,
    Permission.CREATE_ORDER,
    Permission.READ_ORDERS,
    Permission.UPDATE_ORDER,
    Permission.MARK_ORDER_PAID,
    Permission.VIEW_METRICS,
  ],

  [Role.ADMIN]: Object.values(Permission),
};
