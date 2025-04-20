import { BaseError } from "./base.error";
import { NotFoundError, ValidationError } from "./domain-errors";

/**
 * Error de producto no encontrado
 * @class
 * @extends NotFoundError
 */
export class ProductNotFoundError extends NotFoundError {
  /**
   * Crea una nueva instancia de ProductNotFoundError
   * @param {string} id - Identificador del producto
   */
  constructor(id: string) {
    super("Producto", id);
    this.name = "ProductNotFoundError";
  }
}

/**
 * Error de producto sin stock
 * @class
 * @extends BaseError
 */
export class ProductOutOfStockError extends BaseError {
  /**
   * Crea una nueva instancia de ProductOutOfStockError
   * @param {string} productId - ID del producto
   * @param {number} requestedQuantity - Cantidad solicitada
   * @param {number} availableQuantity - Cantidad disponible
   */
  constructor(
    productId: string,
    requestedQuantity: number,
    availableQuantity: number,
  ) {
    super(`Producto sin stock suficiente`, 400, "PRODUCT_OUT_OF_STOCK_ERROR", {
      productId,
      requestedQuantity,
      availableQuantity,
    });
    this.name = "ProductOutOfStockError";
  }
}

/**
 * Error de validación de producto
 * @class
 * @extends ValidationError
 */
export class ProductValidationError extends ValidationError {
  /**
   * Crea una nueva instancia de ProductValidationError
   * @param {string} message - Mensaje descriptivo del error
   * @param {Record<string, any>} details - Detalles de validación fallidos
   */
  constructor(message: string, details: Record<string, any>) {
    super(message, details);
    this.name = "ProductValidationError";
  }
}

/**
 * Error de precio de producto inválido
 * @class
 * @extends ValidationError
 */
export class InvalidProductPriceError extends ValidationError {
  /**
   * Crea una nueva instancia de InvalidProductPriceError
   * @param {number} price - Precio inválido
   */
  constructor(price: number) {
    super("El precio del producto no es válido", {
      price,
      requirements: [
        "El precio debe ser mayor que cero",
        "El precio debe tener máximo dos decimales",
      ],
    });
    this.name = "InvalidProductPriceError";
  }
}
