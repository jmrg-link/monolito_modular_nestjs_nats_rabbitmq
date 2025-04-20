import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Permission, Role, RolePermissions } from "../enums/role.enum";

/**
 * Guard para verificar permisos específicos de usuario.
 * Proporciona control de acceso granular basado en el sistema de permisos.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  /**
   * Constructor del guard de permisos
   * @param reflector Servicio para acceder a metadatos de reflection
   */
  constructor(private reflector: Reflector) {}

  /**
   * Verifica si el usuario tiene los permisos requeridos para acceder al recurso.
   * @param context Contexto de ejecución que contiene la solicitud
   * @returns Boolean indicando si se permite el acceso
   * @throws ForbiddenException si el usuario no tiene los permisos necesarios
   * @throws UnauthorizedException si no hay usuario autenticado
   */
  canActivate(context: ExecutionContext): boolean {
    // Obtener permisos requeridos desde los metadatos
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      "permissions",
      [context.getHandler(), context.getClass()],
    );

    // Si no se especificaron permisos, permitir acceso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Obtener información del usuario desde la request
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    // Verificar si hay un usuario autenticado
    if (!user) {
      this.logger.warn(`Intento de acceso sin autenticación a ruta protegida`);
      throw new UnauthorizedException("No está autenticado");
    }

    // Obtener los roles y permisos del usuario
    const userRoles: Role[] = user.roles || [];
    const userPermissions: Permission[] = user.permissions || [];

    // Los administradores tienen acceso a todo
    if (userRoles.includes(Role.ADMIN)) {
      this.logger.debug(`Acceso autorizado: usuario admin ${user.id}`);
      return true;
    }

    // Calcular todos los permisos del usuario (explícitos + derivados de roles)
    const allUserPermissions = new Set<Permission>(userPermissions);

    // Añadir permisos derivados de roles
    for (const role of userRoles) {
      const rolePermissions = RolePermissions[role] || [];
      for (const permission of rolePermissions) {
        allUserPermissions.add(permission);
      }
    }

    // Verificar si el usuario tiene todos los permisos requeridos
    const hasAllPermissions = requiredPermissions.every((permission) =>
      allUserPermissions.has(permission),
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (permission) => !allUserPermissions.has(permission),
      );

      this.logger.warn(
        `Acceso denegado: Usuario ${user.id} no tiene permisos: ${missingPermissions.join(", ")}`,
      );

      throw new ForbiddenException(
        `No tiene los permisos necesarios para realizar esta acción. Permisos requeridos: ${requiredPermissions.join(", ")}`,
      );
    }

    this.logger.debug(
      `Acceso autorizado: Usuario ${user.id} tiene todos los permisos requeridos`,
    );
    return true;
  }
}
