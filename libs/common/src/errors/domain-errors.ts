import { BaseError } from "./base.error";

/**
 * Error de validación para datos inválidos
 * @class
 * @extends BaseError
 */
export class ValidationError extends BaseError {
  /**
   * Crea una nueva instancia de ValidationError
   * @param {string} message - Mensaje descriptivo del error
   * @param {Record<string, any>} [details] - Detalles de validación fallidos
   */
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

/**
 * Error de recurso no encontrado
 * @class
 * @extends BaseError
 */
export class NotFoundError extends BaseError {
  /**
   * Crea una nueva instancia de NotFoundError
   * @param {string} resource - Nombre del recurso no encontrado
   * @param {string} [id] - Identificador del recurso buscado
   */
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} con id ${id} no encontrado`
      : `${resource} no encontrado`;

    super(message, 404, "NOT_FOUND_ERROR", { resource, id });
    this.name = "NotFoundError";
  }
}

/**
 * Error de autenticación
 * @class
 * @extends BaseError
 */
export class AuthenticationError extends BaseError {
  /**
   * Crea una nueva instancia de AuthenticationError
   * @param {string} message - Mensaje descriptivo del error
   */
  constructor(message: string = "No autenticado") {
    super(message, 401, "AUTHENTICATION_ERROR");
    this.name = "AuthenticationError";
  }
}

/**
 * Error de autorización
 * @class
 * @extends BaseError
 */
export class AuthorizationError extends BaseError {
  /**
   * Crea una nueva instancia de AuthorizationError
   * @param {string} message - Mensaje descriptivo del error
   * @param {string} [resource] - Recurso al que se intentó acceder
   * @param {string} [action] - Acción que se intentó realizar
   */
  constructor(
    message: string = "No autorizado",
    resource?: string,
    action?: string,
  ) {
    super(message, 403, "AUTHORIZATION_ERROR", { resource, action });
    this.name = "AuthorizationError";
  }
}

/**
 * Error de servicio externo
 * @class
 * @extends BaseError
 */
export class ExternalServiceError extends BaseError {
  /**
   * Crea una nueva instancia de ExternalServiceError
   * @param {string} service - Nombre del servicio externo
   * @param {string} [details] - Detalles del error
   * @param {Error} [originalError] - Error original capturado
   */
  constructor(service: string, details?: string, originalError?: Error) {
    const message = `Error en servicio externo: ${service}`;
    super(message, 503, "EXTERNAL_SERVICE_ERROR", {
      service,
      details,
      originalError: originalError
        ? {
            message: originalError.message,
            stack: originalError.stack,
          }
        : undefined,
    });
    this.name = "ExternalServiceError";
  }
}

/**
 * Error de operación no permitida
 * @class
 * @extends BaseError
 */
export class OperationNotAllowedError extends BaseError {
  /**
   * Crea una nueva instancia de OperationNotAllowedError
   * @param {string} message - Mensaje descriptivo del error
   * @param {string} [operation] - Operación intentada
   */
  constructor(message: string, operation?: string) {
    super(message, 400, "OPERATION_NOT_ALLOWED", { operation });
    this.name = "OperationNotAllowedError";
  }
}

/**
 * Error de conflicto en la operación
 * @class
 * @extends BaseError
 */
export class ConflictError extends BaseError {
  /**
   * Crea una nueva instancia de ConflictError
   * @param {string} message - Mensaje descriptivo del error
   * @param {Record<string, any>} [details] - Detalles del conflicto
   */
  constructor(message: string, details?: Record<string, any>) {
    super(message, 409, "CONFLICT_ERROR", details);
    this.name = "ConflictError";
  }
}
