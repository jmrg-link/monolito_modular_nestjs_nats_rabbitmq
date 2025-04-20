/**
 * Value Object para el identificador de producto.
 * Garantiza inmutabilidad y validez del ID.
 */
export class ProductId {
  /**
   * Crea un nuevo ProductId.
   * @param value Valor único del identificador.
   */
  constructor(public readonly value: string) {
    if (!value || value.length < 8) {
      throw new Error("ProductId inválido");
    }
  }
}
