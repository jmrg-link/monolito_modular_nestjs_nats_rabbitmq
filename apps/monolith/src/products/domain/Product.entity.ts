/**
 * Entidad de dominio Product.
 * Cumple con los principios de DDD y SOLID.
 */
export class Product {
  /**
   * Crea una nueva instancia de producto.
   * @param id Identificador único del producto.
   * @param name Nombre del producto.
   * @param price Precio del producto.
   */
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly price: number,
  ) {}

  /**
   * Cambia el precio del producto.
   * @param newPrice Nuevo precio.
   * @returns Nueva instancia de Product con el precio actualizado.
   */
  changePrice(newPrice: number): Product {
    return new Product(this.id, this.name, newPrice);
  }
}
