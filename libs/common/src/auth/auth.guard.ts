/**
 * Guards para protección de rutas
 * @module Common/Auth
 */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";
import { UserAuth } from "../interfaces/auth.interface";

/**
 * Guard para autenticación JWT
 * @class JwtAuthGuard
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  /**
   * Determina si la petición puede acceder a la ruta
   * @param context - Contexto de ejecución
   * @returns Boolean que indica si está permitido el acceso
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  /**
   * Maneja errores en la autenticación
   * @param error - Error ocurrido
   */
  handleRequest(err: any, user: any, info: any): any {
    if (err || !user) {
      throw err || new UnauthorizedException("No autorizado");
    }
    return user;
  }
}

/**
 * Guard para verificación de roles
 * @class RolesGuard
 */
@Injectable()
export class RolesGuard implements CanActivate {
  /**
   * Constructor del guard de roles
   * @param reflector - Reflector para obtener metadatos
   */
  constructor(private reflector: Reflector) {}

  /**
   * Determina si el usuario tiene los roles requeridos
   * @param context - Contexto de ejecución
   * @returns Boolean que indica si está permitido el acceso
   */
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new UnauthorizedException("No autenticado");
    }

    const userAuth = user as UserAuth;
    const hasRole = requiredRoles.some((role) =>
      userAuth.roles?.includes(role),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Acceso denegado: Se requiere uno de estos roles: ${requiredRoles.join(", ")}`,
      );
    }

    return true;
  }
}
