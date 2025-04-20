/**
 * Value Object para el identificador de usuario.
 * Garantiza inmutabilidad y validez del ID.
 */
export class UserId {
  /**
   * Crea un nuevo UserId.
   * @param value Valor único del identificador.
   */
  constructor(public readonly value: string) {
    if (!value || value.length < 8) {
      throw new Error("UserId inválido");
    }
  }
}
