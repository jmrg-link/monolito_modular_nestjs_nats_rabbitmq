/**
 * Interfaces para el sistema de paginación.
 * @module Interfaces/Pagination
 */

/**
 * Opciones para la paginación de resultados.
 * Define parámetros para controlar la cantidad y ordenamiento de resultados.
 */
export interface PaginationOptions {
  /** Número de página actual (comienza en 1) */
  page: number;

  /** Número máximo de elementos por página */
  limit: number;

  /** Campo por el cual ordenar los resultados */
  sortBy?: string;

  /** Dirección de ordenamiento (ascendente o descendente) */
  sortDirection?: "asc" | "desc";
}

/**
 * Resultados paginados.
 * Contiene los elementos de la página actual y metadatos de paginación.
 * @template T - Tipo de los elementos en la colección
 */
export interface PaginatedResult<T> {
  /** Lista de elementos correspondientes a la página actual */
  items: T[];

  /** Metadatos de la paginación */
  meta: {
    /** Número total de elementos en todas las páginas */
    totalItems: number;

    /** Número de elementos por página */
    itemsPerPage: number;

    /** Número total de páginas */
    totalPages: number;

    /** Número de la página actual */
    currentPage: number;

    /** Indica si existe una página siguiente */
    hasNextPage: boolean;

    /** Indica si existe una página anterior */
    hasPreviousPage: boolean;
  };
}
