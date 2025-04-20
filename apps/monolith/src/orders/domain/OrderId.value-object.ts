/**
 * Value Object para el identificador de orden.
 * Garantiza inmutabilidad y validez del ID.
 */
export class OrderId {
  /**
   * Crea un nuevo OrderId.
   * @param value Valor único del identificador.
   */
  constructor(public readonly value: string) {
    if (!value || value.length < 8) {
      throw new Error("OrderId inválido");
    }
  }
}
