import { SetMetadata } from "@nestjs/common";
import { Permission } from "../enums/role.enum";

/**
 * Decorador para definir los permisos requeridos para un endpoint.
 * @param permissions Permisos necesarios para acceder al recurso
 * @returns Decorador con metadatos de permisos requeridos
 */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata("permissions", permissions);
