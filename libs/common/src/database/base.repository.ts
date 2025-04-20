/**
 * Implementación base para repositorios de MongoDB con Mongoose.
 * Proporciona patrones CRUD y paginación genérica para las entidades del dominio.
 *
 * @module Common/Database
 */
import { Document, FilterQuery, Model, QueryOptions } from "mongoose";
import { BaseRepository } from "../interfaces/repository.interface";
import {
  PaginatedResult,
  PaginationOptions,
} from "../interfaces/pagination.interface";
import { NotFoundException } from "@nestjs/common";

/**
 * Clase base para repositorios de MongoDB
 * @template T - Tipo de entidad de dominio
 * @template TDocument - Tipo de documento Mongoose
 */
export abstract class BaseMongoRepository<T, TDocument extends Document>
  implements BaseRepository<T>
{
  /**
   * Constructor para el repositorio base
   * @param model - Modelo Mongoose para la colección
   * @param entityName - Nombre descriptivo de la entidad (para mensajes de error)
   */
  constructor(
    protected readonly model: Model<TDocument>,
    protected readonly entityName: string,
  ) {}

  /**
   * Crea una nueva entidad en la base de datos.
   * Si el objeto tiene una propiedad 'id' con valor undefined o null,
   * esta propiedad se omite para permitir que MongoDB genere un ObjectId automáticamente.
   *
   * @param createEntityData - Datos para crear la entidad
   * @returns Entidad de dominio creada
   */
  async create(createEntityData: Partial<T>): Promise<T> {
    const hasNullId =
      "id" in createEntityData &&
      (createEntityData["id"] === undefined || createEntityData["id"] === null);

    if (hasNullId) {
      // Si el ID es nulo, extrae los datos sin incluir el ID
      const { id, ...dataWithoutId } = createEntityData as any;
      const entity = new this.model(dataWithoutId);
      const savedEntity = await entity.save();
      return this.mapToDomain(savedEntity);
    } else {
      const entity = new this.model(createEntityData as any);
      const savedEntity = await entity.save();
      return this.mapToDomain(savedEntity);
    }
  }

  /**
   * Encuentra una entidad por su ID
   * @param id - ID de la entidad
   * @returns Entidad de dominio o null si no existe
   */
  async findById(id: string): Promise<T | null> {
    const entity = await this.model.findById(id).exec();
    return entity ? this.mapToDomain(entity) : null;
  }

  /**
   * Busca entidades que coinciden con los criterios especificados
   * @param filterQuery - Consulta de filtrado para MongoDB
   * @param options - Opciones adicionales de consulta
   * @returns Lista de entidades de dominio
   */
  async find(
    filterQuery?: FilterQuery<T>,
    options?: QueryOptions,
  ): Promise<T[]> {
    const entities = await this.model
      .find((filterQuery as any) || {}, null, options)
      .exec();
    return entities.map((entity) => this.mapToDomain(entity));
  }

  /**
   * Encuentra una única entidad que coincide con la consulta
   * @param filterQuery - Consulta de filtrado para MongoDB
   * @returns Entidad de dominio o null si no existe
   */
  async findOne(filterQuery: FilterQuery<T>): Promise<T | null> {
    const entity = await this.model.findOne(filterQuery as any).exec();
    return entity ? this.mapToDomain(entity) : null;
  }

  /**
   * Recupera entidades con soporte de paginación, ordenamiento y filtros
   * @param options - Opciones de paginación y ordenamiento
   * @param filterQuery - Consulta de filtrado para MongoDB
   * @returns Resultado paginado con metadatos
   */
  async findWithPagination(
    options: PaginationOptions,
    filterQuery?: FilterQuery<T>,
  ): Promise<PaginatedResult<T>> {
    const { page = 1, limit = 10, sortBy, sortDirection = "desc" } = options;
    const skip = (page - 1) * limit;
    const query = this.model.find((filterQuery as any) || {});
    if (sortBy) {
      const sortOptions: Record<string, "asc" | "desc"> = {};
      sortOptions[sortBy] = sortDirection;
      query.sort(sortOptions);
    }

    const [items, totalItems] = await Promise.all([
      query.skip(skip).limit(limit).exec(),
      this.model.countDocuments((filterQuery as any) || {}).exec(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: items.map((item) => this.mapToDomain(item)),
      meta: {
        totalItems,
        itemsPerPage: limit,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Actualiza una entidad existente por su ID
   * @param id - ID de la entidad
   * @param updateData - Datos a actualizar
   * @returns Entidad actualizada
   * @throws NotFoundException - Si la entidad no existe
   */
  async update(id: string, updateData: any): Promise<T | null> {
    const updatedEntity = await this.model
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();

    if (!updatedEntity) {
      throw new NotFoundException(
        `${this.entityName} con ID "${id}" no encontrado`,
      );
    }

    return this.mapToDomain(updatedEntity);
  }

  /**
   * Elimina una entidad por su ID
   * @param id - ID de la entidad
   * @returns Entidad eliminada
   * @throws NotFoundException - Si la entidad no existe
   */
  async delete(id: string): Promise<T | null> {
    const deletedEntity = await this.model.findByIdAndDelete(id).exec();

    if (!deletedEntity) {
      throw new NotFoundException(
        `${this.entityName} con ID "${id}" no encontrado`,
      );
    }

    return this.mapToDomain(deletedEntity);
  }

  /**
   * Cuenta las entidades que coinciden con los criterios especificados
   * @param filterQuery - Consulta de filtrado para MongoDB
   * @returns Número de entidades
   */
  async count(filterQuery?: FilterQuery<T>): Promise<number> {
    return this.model.countDocuments((filterQuery as any) || {}).exec();
  }

  /**
   * Convierte un documento Mongoose a una entidad de dominio
   * @param document - Documento Mongoose
   * @returns Entidad de dominio
   */
  protected abstract mapToDomain(document: TDocument): T;
}
