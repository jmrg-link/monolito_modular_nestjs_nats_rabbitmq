/**
 * @file Interfaces genéricas para el patrón Repository
 * @module Common/Interfaces/Repository
 * @description Proporciona abstracciones para operaciones CRUD y consultas paginadas
 */
import { PaginatedResult, PaginationOptions } from "./pagination.interface";
import { FilterQuery, QueryOptions } from "mongoose";

/**
 * Interfaz genérica para repositorios con operaciones CRUD y paginación
 * @interface BaseRepository
 * @template T - Tipo de entidad gestionada
 * @template ID - Tipo del identificador único (por defecto string)
 */
export interface BaseRepository<T, ID = string> {
  /**
   * Crea una nueva entidad en el repositorio
   * @param {Partial<T>} entity - Datos de la entidad a crear
   * @returns {Promise<T>} Entidad creada con su identificador asignado
   */
  create(entity: Partial<T>): Promise<T>;

  /**
   * Busca una entidad por su identificador único
   * @param {ID} id - Identificador único de la entidad
   * @returns {Promise<T | null>} Entidad encontrada o null si no existe
   */
  findById(id: ID): Promise<T | null>;

  /**
   * Encuentra todas las entidades que coinciden con los criterios especificados
   * @param {FilterQuery<T>} [filterQuery] - Criterios de filtrado opcionales
   * @param {QueryOptions} [options] - Opciones adicionales para la consulta
   * @returns {Promise<T[]>} Array de entidades que cumplen los criterios
   */
  find(filterQuery?: FilterQuery<T>, options?: QueryOptions): Promise<T[]>;

  /**
   * Encuentra entidades con soporte para paginación
   * @param options - Configuración de paginación (página, límite, ordenamiento)
   * @param filterQuery - Criterios de filtrado opcionales
   * @returns Promesa con resultado paginado que incluye metadatos de navegación
   */
  findWithPagination(
    options: PaginationOptions,
    filterQuery?: FilterQuery<T>,
  ): Promise<PaginatedResult<T>>;

  /**
   * Encuentra una única entidad que coincide con los criterios especificados
   * @param filterQuery - Criterios de filtrado
   * @returns Promesa con la primera entidad que cumple los criterios o null si no existe
   */
  findOne(filterQuery: FilterQuery<T>): Promise<T | null>;

  /**
   * Actualiza una entidad existente por su identificador
   * @param id - Identificador único de la entidad a actualizar
   * @param updateData - Datos a actualizar (parcial)
   * @returns Promesa con la entidad actualizada o null si no existe
   */
  update(id: ID, updateData: any): Promise<T | null>;

  /**
   * Elimina una entidad por su identificador
   * @param id - Identificador único de la entidad a eliminar
   * @returns Promesa con la entidad eliminada o null si no existía
   */
  delete(id: ID): Promise<T | null>;

  /**
   * Cuenta el número de entidades que coinciden con los criterios especificados
   * @param filterQuery - Criterios de filtrado opcionales
   * @returns Promesa con el número de entidades encontradas
   */
  count(filterQuery?: FilterQuery<T>): Promise<number>;
}
