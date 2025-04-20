import { BaseError } from "./base.error";
import { ConflictError, NotFoundError, ValidationError } from "./domain-errors";

/**
 * Error de usuario no encontrado
 * @class
 * @extends NotFoundError
 */
export class UserNotFoundError extends NotFoundError {
  /**
   * Crea una nueva instancia de UserNotFoundError
   * @param {string} id - Identificador del usuario
   */
  constructor(id: string) {
    super("Usuario", id);
    this.name = "UserNotFoundError";
  }
}

/**
 * Error de email ya registrado
 * @class
 * @extends ConflictError
 */
export class EmailAlreadyRegisteredError extends ConflictError {
  /**
   * Crea una nueva instancia de EmailAlreadyRegisteredError
   * @param {string} email - Email que ya está registrado
   */
  constructor(email: string) {
    super(`El email ${email} ya está registrado`, { email });
    this.name = "EmailAlreadyRegisteredError";
  }
}

/**
 * Error de credenciales inválidas
 * @class
 * @extends BaseError
 */
export class InvalidCredentialsError extends BaseError {
  /**
   * Crea una nueva instancia de InvalidCredentialsError
   */
  constructor() {
    super("Credenciales inválidas", 401, "INVALID_CREDENTIALS_ERROR");
    this.name = "InvalidCredentialsError";
  }
}

/**
 * Error de validación de contraseña
 * @class
 * @extends ValidationError
 */
export class PasswordValidationError extends ValidationError {
  /**
   * Crea una nueva instancia de PasswordValidationError
   * @param {string} message - Mensaje descriptivo del error
   */
  constructor(
    message: string = "La contraseña no cumple con los requisitos de seguridad",
  ) {
    super(message, {
      requirements: [
        "Mínimo 8 caracteres",
        "Al menos una letra mayúscula",
        "Al menos una letra minúscula",
        "Al menos un número",
      ],
    });
    this.name = "PasswordValidationError";
  }
}

/**
 * Error de usuario desactivado
 * @class
 * @extends BaseError
 */
export class UserDeactivatedError extends BaseError {
  /**
   * Crea una nueva instancia de UserDeactivatedError
   * @param {string} userId - ID del usuario desactivado
   */
  constructor(userId: string) {
    super(
      "La cuenta de usuario está desactivada",
      403,
      "USER_DEACTIVATED_ERROR",
      { userId },
    );
    this.name = "UserDeactivatedError";
  }
}
