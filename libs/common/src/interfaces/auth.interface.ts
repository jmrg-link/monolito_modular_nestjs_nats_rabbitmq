/**
 * @file Define las interfaces principales del sistema de autenticación y autorización
 * @module Auth
 * @description Este módulo contiene las interfaces que dan soporte a la autenticación mediante JWT,
 * la representación pública de usuarios y las respuestas estándar de operaciones de autenticación
 */

/**
 * Payload estándar incluido en los tokens JWT para autenticación y autorización.
 * Esta estructura se codifica en el token y se decodifica en cada solicitud autenticada.
 * @interface
 * @property {string} sub - Identificador único del usuario (subject) conforme a estándar JWT
 * @property {string} email - Correo electrónico verificado del usuario para identificación rápida
 * @property {string[]} roles - Roles asignados al usuario para control de acceso basado en roles (RBAC)
 * @property {number} [iat] - Timestamp de emisión del token en segundos (UNIX epoch) - campo estándar JWT
 * @property {number} [exp] - Timestamp de expiración del token en segundos (UNIX epoch) - campo estándar JWT
 */
export interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

/**
 * Información pública del usuario para respuestas API.
 * Contiene solo datos no sensibles que pueden exponerse con seguridad.
 * @interface
 * @property {string} id - Identificador único del usuario
 * @property {string} email - Correo electrónico del usuario
 * @property {string} name - Nombre completo del usuario
 * @property {string[]} roles - Roles asignados al usuario
 */
export interface UserInfo {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

/**
 * Respuesta estándar para operaciones de autenticación exitosas.
 * Implementa el patrón de autenticación JWT con token de refresco para mayor seguridad.
 * @interface
 * @property {string} accessToken - Token JWT de acceso para autorizar peticiones subsecuentes (corta duración)
 * @property {string} refreshToken - Token de refresco para obtener nuevos tokens sin requerir credenciales (larga duración)
 * @property {number} expiresIn - Tiempo de expiración del token de acceso en segundos desde emisión
 * @property {UserInfo} user - Información básica del usuario autenticado para uso inmediato en frontend
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserInfo;
}

/**
 * Representación del usuario autenticado para uso interno en requests.
 * Se construye a partir del token JWT decodificado y se usa en guards y decoradores.
 * @interface
 * @property {string} id - Identificador único del usuario
 * @property {string} email - Correo electrónico del usuario
 * @property {string[]} roles - Roles asignados al usuario para control de acceso
 */
export interface UserAuth {
  id: string;
  email: string;
  roles: string[];
}
