/**
 * Decorador combinado para control de acceso basado en roles y permisos
 * @module Common/Auth
 */
import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth.guard";
import { RolesGuard } from "../guards/role.guard";
import { PermissionGuard } from "../guards/permission.guard";
import { Role, Permission } from "../enums/role.enum";

/**
 * Decorador para asignar roles y permisos a un controlador o método
 * Combina la autenticación JWT, verificación de roles y permisos
 *
 * @param roles Roles requeridos para acceder al endpoint (opcional)
 * @param permissions Permisos requeridos para acceder al endpoint (opcional)
 * @returns Decorador compuesto con guardias y documentación Swagger
 */
export function Auth(roles?: Role[], permissions?: Permission[]) {
  const decorators = [
    UseGuards(JwtAuthGuard),
    ApiBearerAuth("access-token"),
    ApiUnauthorizedResponse({
      description: "No autorizado - Token inválido o expirado",
    }),
  ];

  // Añadir guardia y metadatos de roles si se especifican roles
  if (roles && roles.length > 0) {
    decorators.push(
      SetMetadata("roles", roles),
      UseGuards(RolesGuard),
      ApiForbiddenResponse({
        description:
          "Prohibido - No tiene los roles necesarios para realizar esta acción",
      }),
    );
  }

  // Añadir guardia y metadatos de permisos si se especifican permisos
  if (permissions && permissions.length > 0) {
    decorators.push(
      SetMetadata("permissions", permissions),
      UseGuards(PermissionGuard),
      ApiForbiddenResponse({
        description:
          "Prohibido - No tiene los permisos necesarios para realizar esta acción",
      }),
    );
  }

  return applyDecorators(...decorators);
}

/**
 * Decorador para endpoints accesibles solo por administradores
 * @returns Decorador compuesto con roles de admin
 */
export function AdminOnly() {
  return Auth([Role.ADMIN]);
}

/**
 * Decorador para endpoints accesibles por administradores y personal
 * @returns Decorador compuesto con roles de admin y staff
 */
export function StaffOnly() {
  return Auth([Role.ADMIN, Role.STAFF]);
}

/**
 * Decorador para endpoints que requieren verificación de email
 * @returns Decorador para verificar email
 */
export function RequireVerifiedEmail() {
  return SetMetadata("requireVerifiedEmail", true);
}

/**
 * Decorador para definir que el usuario solo puede acceder a sus propios recursos
 * @returns Decorador para acceso a recursos propios
 */
export function SelfAccessOnly() {
  return SetMetadata("selfAccessOnly", true);
}

/**
 * Decorador para endpoints públicos (no requieren autenticación)
 * @returns Decorador que marca un endpoint como público
 */
export function Public() {
  return SetMetadata("isPublic", true);
}
