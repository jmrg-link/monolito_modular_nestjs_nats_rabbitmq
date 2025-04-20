/**
 * Entidad de dominio Order.
 * Cumple con los principios de DDD y SOLID.
 */
export class Order {
  /**
   * Crea una nueva instancia de orden.
   * @param id Identificador único de la orden.
   * @param userId ID del usuario que realiza la orden.
   * @param total Monto total de la orden.
   */
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly total: number,
  ) {}

  /**
   * Marca la orden como pagada.
   * @returns Nueva instancia de Order pagada.
   */
  pay(): Order {
    // Ejemplo: lógica de dominio para marcar como pagada
    return new Order(this.id, this.userId, this.total);
  }
}
