import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { IUserRepository } from "../infrastructure/User.repository";
import { User } from "../domain/User.entity";
import {
  PaginatedResult,
  PaginationOptions,
} from "@libs/common/src/interfaces/pagination.interface";

/**
 * Servicio de aplicación para operaciones de usuarios
 * @class UserService
 * @description Implementa la lógica de negocio para usuarios, comunicación entre controladores y repositorio
 */
@Injectable()
export class UserService {
  /**
   * Logger para el servicio de usuarios
   * @readonly
   * @private
   */
  private readonly logger = new Logger(UserService.name);

  /**
   * Constructor del servicio de usuarios
   * @param {IUserRepository} userRepository - Repositorio para persistencia de usuarios
   * @param {ClientProxy} natsClient - Cliente para mensajería NATS
   * @param {ClientProxy} rabbitClient - Cliente para mensajería RabbitMQ
   */
  constructor(
    @Inject("IUserRepository")
    private readonly userRepository: IUserRepository,
    @Inject("NATS_SERVICE") private readonly natsClient: ClientProxy,
    @Inject("RABBITMQ_SERVICE") private readonly rabbitClient: ClientProxy,
  ) {}

  /**
   * Crea un nuevo usuario
   * @param user Entidad de dominio User
   * @param password Contraseña en texto plano para hashear (opcional si se proporciona passwordHash)
   * @param passwordHash Hash de contraseña precalculado (opcional)
   * @returns Usuario creado con datos e ID
   * @throws BadRequestException Si el email ya está registrado
   */
  async createUser(
    user: User,
    password: string = "",
    passwordHash: string = "",
  ) {
    const existingUser = await this.userRepository.findByEmail(user.email);
    if (existingUser) {
      throw new BadRequestException(
        `El email ${user.email} ya está registrado`,
      );
    }

    let finalPasswordHash = passwordHash;

    if (!finalPasswordHash && password) {
      const bcrypt = require("bcrypt");
      finalPasswordHash = await bcrypt.hash(password, 10);
    } else if (!finalPasswordHash && !password) {
      throw new BadRequestException(
        "Se requiere una contraseña o un hash de contraseña para crear el usuario",
      );
    }

    const created = await this.userRepository.create({
      ...user,
      passwordHash: finalPasswordHash,
    } as any);

    this.publishUserCreatedEvents(created);

    return created;
  }

  /**
   * Lista todos los usuarios
   * @returns Array con todos los usuarios
   */
  async findAll() {
    return this.userRepository.find();
  }

  /**
   * Obtiene usuarios con paginación
   * @param options Opciones de paginación
   * @returns Resultado paginado con usuarios y metadatos
   */
  async findWithPagination(
    options: PaginationOptions,
  ): Promise<PaginatedResult<User>> {
    return this.userRepository.findWithPagination(options);
  }

  /**
   * Busca un usuario por ID
   * @param id Identificador único del usuario
   * @returns Usuario encontrado
   * @throws NotFoundException Si el usuario no existe
   */
  async findById(id: string) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  /**
   * Busca un usuario por email
   * @param email Email del usuario
   * @returns Usuario encontrado o null
   */
  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  /**
   * Busca usuarios por término (nombre o email)
   * @param term Término de búsqueda
   * @returns Array de usuarios que coinciden
   */
  async searchUsers(term: string) {
    return this.userRepository.searchByTerm(term);
  }

  /**
   * Busca usuarios por rol
   * @param role Rol a buscar
   * @returns Array de usuarios con el rol especificado
   */
  async findByRole(role: string) {
    return this.userRepository.findByRole(role);
  }

  /**
   * Actualiza un usuario
   * @param id Identificador único del usuario
   * @param update Campos a actualizar
   * @returns Usuario actualizado
   * @throws BadRequestException Si intenta actualizar a un email ya existente
   */
  async updateUser(
    id: string,
    update: Partial<{
      name: string;
      email: string;
      roles: string[];
      isActive: boolean;
    }>,
  ) {
    if (update.email) {
      const existingUser = await this.userRepository.findByEmail(update.email);
      if (existingUser && existingUser.id !== id) {
        throw new BadRequestException(
          `El email ${update.email} ya está registrado`,
        );
      }
    }

    const updated = await this.userRepository.update(id, update);

    this.natsClient.emit("user.updated", { id, ...update });
    this.rabbitClient.emit("user.updated", { id, ...update });

    return updated;
  }

  /**
   * Actualiza la contraseña de un usuario
   * @param id ID del usuario
   * @param passwordHash Hash de la nueva contraseña
   * @returns Usuario actualizado
   * @throws NotFoundException Si el usuario no existe
   */
  async updatePassword(id: string, passwordHash: string) {
    const updated = await this.userRepository.updatePassword(id, passwordHash);
    if (!updated) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    this.natsClient.emit("user.passwordChanged", { id });
    this.rabbitClient.emit("user.passwordChanged", { id });

    return updated;
  }

  /**
   * Elimina un usuario
   * @param id Identificador único del usuario
   * @returns Resultado de la operación
   */
  async deleteUser(id: string) {
    const deleted = await this.userRepository.delete(id);

    this.natsClient.emit("user.deleted", { id });
    this.rabbitClient.emit("user.deleted", { id });

    return deleted;
  }

  /**
   * Desactiva un usuario
   * @param id ID del usuario
   * @returns Usuario actualizado con estado inactivo
   * @throws NotFoundException Si el usuario no existe
   */
  async deactivateUser(id: string) {
    const updated = await this.userRepository.updateActiveStatus(id, false);
    if (!updated) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    this.natsClient.emit("user.deactivated", { id });
    this.rabbitClient.emit("user.deactivated", { id });

    return {
      id: updated.id,
      isActive: false,
      message: "Usuario desactivado correctamente",
    };
  }

  /**
   * Reactiva un usuario
   * @param id ID del usuario
   * @returns Usuario actualizado con estado activo
   * @throws NotFoundException Si el usuario no existe
   */
  async activateUser(id: string) {
    const updated = await this.userRepository.updateActiveStatus(id, true);
    if (!updated) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    this.natsClient.emit("user.activated", { id });
    this.rabbitClient.emit("user.activated", { id });

    return {
      id: updated.id,
      isActive: true,
      message: "Usuario activado correctamente",
    };
  }

  /**
   * Actualiza la fecha del último inicio de sesión de un usuario
   * @param id ID del usuario
   * @param timestamp Fecha y hora del inicio de sesión
   * @returns Usuario actualizado o null si no se encuentra
   */
  async updateLastLoginTimestamp(id: string, timestamp: Date) {
    try {
      this.logger.log(`Actualizando timestamp de login para usuario ID: ${id}`);

      // Actualizamos a través del repositorio
      const updated = await this.userRepository.updateLastLoginTimestamp(
        id,
        timestamp,
      );

      if (updated) {
        this.logger.log(
          `Fecha de último login actualizada correctamente para usuario ID: ${id}`,
        );
      } else {
        this.logger.warn(
          `No se encontró usuario con ID: ${id} para actualizar fecha de login`,
        );
      }

      return updated;
    } catch (error) {
      this.logger.error(
        `Error al actualizar timestamp de login: ${error instanceof Error ? error.message : "Error desconocido"}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  /**
   * Publica eventos de creación de usuario
   * @param user Usuario creado
   */
  private publishUserCreatedEvents(user: any) {
    const eventData = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      isActive: user.isActive,
    };

    this.natsClient.emit("user.created", eventData);
    this.rabbitClient.emit("user.created", eventData);
  }
}
