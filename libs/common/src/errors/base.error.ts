/**
 * Error base para toda la aplicación
 * @class
 * @extends Error
 */
export class BaseError extends Error {
  /**
   * Código HTTP asociado al error
   * @type {number}
   */
  public readonly statusCode: number;

  /**
   * Código interno del error para seguimiento
   * @type {string}
   */
  public readonly errorCode: string;

  /**
   * Detalles adicionales del error
   * @type {Record<string, any>}
   */
  public readonly details?: Record<string, any>;

  /**
   * Crea una nueva instancia de BaseError
   * @param {string} message - Mensaje descriptivo del error
   * @param {number} statusCode - Código HTTP asociado
   * @param {string} errorCode - Código interno del error
   * @param {Record<string, any>} [details] - Detalles adicionales del error
   */
  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = "INTERNAL_ERROR",
    details?: Record<string, any>,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serializa el error para devolverlo como respuesta HTTP
   * @returns {Record<string, any>} Representación serializada del error
   */
  serialize(): Record<string, any> {
    return {
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      message: this.message,
      details: this.details || {},
      timestamp: new Date().toISOString(),
    };
  }
}
