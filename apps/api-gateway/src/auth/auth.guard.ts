import { Injectable, CanActivate, ExecutionContext } from "@nestjs/common";
import { Observable } from "rxjs";

/**
 * Guard personalizado que permite solicitudes públicas a rutas específicas.
 * Se utiliza para permitir que ciertas rutas estén disponibles sin autenticación.
 */
@Injectable()
export class PublicRouteGuard implements CanActivate {
  /**
   * Determina si una solicitud se puede procesar sin autenticación.
   * @param context Contexto de ejecución que contiene información sobre la solicitud
   * @returns true si la ruta es pública o false si se requiere autenticación
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const path = request.route.path;

    // Lista de rutas públicas que no requieren autenticación
    const publicRoutes = [
      "/public/users/check-email",
      // Añadir otras rutas públicas aquí
    ];

    return publicRoutes.some((route) => path.includes(route));
  }
}
