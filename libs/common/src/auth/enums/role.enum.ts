/**
 * @file Definiciones de roles y permisos del sistema
 * @module Auth/Enums
 * @description Define la estructura de control de acceso basado en roles (RBAC)
 */

/**
 * Roles disponibles en el sistema para asignación a usuarios
 * @enum {string}
 */
export enum Role {
  DEFAULT = "default",
  CUSTOM = "custom",
  STAFF = "staff",
  ADMIN = "admin",
}

/**
 * Permisos granulares del sistema para control de acceso fino
 * @enum {string}
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

  [Role.CUSTOM]: [], // Permisos personalizados asignados dinámicamente

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

  [Role.ADMIN]: Object.values(Permission), // Todos los permisos
};
