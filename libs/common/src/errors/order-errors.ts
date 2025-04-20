import { BaseError } from "./base.error";
import { NotFoundError } from "./domain-errors";

/**
 * Error de orden no encontrada
 * @class
 * @extends NotFoundError
 */
export class OrderNotFoundError extends NotFoundError {
  /**
   * Crea una nueva instancia de OrderNotFoundError
   * @param {string} id - Identificador de la orden
   */
  constructor(id: string) {
    super("Orden", id);
    this.name = "OrderNotFoundError";
  }
}

/**
 * Error de estado de orden inválido
 * @class
 * @extends BaseError
 */
export class InvalidOrderStatusError extends BaseError {
  /**
   * Crea una nueva instancia de InvalidOrderStatusError
   * @param {string} currentStatus - Estado actual de la orden
   * @param {string} requestedStatus - Estado solicitado
   * @param {string[]} allowedTransitions - Transiciones permitidas desde el estado actual
   */
  constructor(
    currentStatus: string,
    requestedStatus: string,
    allowedTransitions: string[],
  ) {
    super(
      `No se puede cambiar el estado de la orden de '${currentStatus}' a '${requestedStatus}'`,
      400,
      "INVALID_ORDER_STATUS_ERROR",
      {
        currentStatus,
        requestedStatus,
        allowedTransitions,
      },
    );
    this.name = "InvalidOrderStatusError";
  }
}

/**
 * Error de pago de orden fallido
 * @class
 * @extends BaseError
 */
export class OrderPaymentFailedError extends BaseError {
  /**
   * Crea una nueva instancia de OrderPaymentFailedError
   * @param {string} orderId - ID de la orden
   * @param {string} reason - Razón del fallo
   * @param {Record<string, any>} [paymentDetails] - Detalles del intento de pago
   */
  constructor(
    orderId: string,
    reason: string,
    paymentDetails?: Record<string, any>,
  ) {
    super(
      `Fallo en el pago de la orden: ${reason}`,
      400,
      "ORDER_PAYMENT_FAILED_ERROR",
      {
        orderId,
        reason,
        paymentDetails,
      },
    );
    this.name = "OrderPaymentFailedError";
  }
}

/**
 * Error de orden vacía
 * @class
 * @extends BaseError
 */
export class EmptyOrderError extends BaseError {
  /**
   * Crea una nueva instancia de EmptyOrderError
   */
  constructor() {
    super(
      "No se puede crear una orden sin productos",
      400,
      "EMPTY_ORDER_ERROR",
    );
    this.name = "EmptyOrderError";
  }
}

/**
 * Error de orden ya procesada
 * @class
 * @extends BaseError
 */
export class OrderAlreadyProcessedError extends BaseError {
  /**
   * Crea una nueva instancia de OrderAlreadyProcessedError
   * @param {string} orderId - ID de la orden
   * @param {string} status - Estado actual de la orden
   */
  constructor(orderId: string, status: string) {
    super(
      `La orden ya ha sido procesada y no puede modificarse`,
      409,
      "ORDER_ALREADY_PROCESSED_ERROR",
      {
        orderId,
        currentStatus: status,
      },
    );
    this.name = "OrderAlreadyProcessedError";
  }
}
