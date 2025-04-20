/**
 * @file Implementación de decoradores para control de acceso basado en roles
 * @module Common/Auth
 * @description Proporciona decoradores que permiten asignar requisitos de roles a rutas y controladores
 */
import { SetMetadata } from "@nestjs/common";

/**
 * Clave utilizada para almacenar metadatos de roles en reflection metadata
 * @const {string}
 */
export const ROLES_KEY = "roles";

/**
 * Decorador para asignar roles requeridos a un controlador o método
 * @function
 * @param {string[]} roles - Roles requeridos para acceder al endpoint
 * @returns {MethodDecorator & ClassDecorator} Decorador que puede aplicarse a nivel de método o clase
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
