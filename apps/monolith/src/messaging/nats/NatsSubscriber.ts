import {
  Injectable,
  Logger,
  OnModuleInit,
  BadRequestException,
} from "@nestjs/common";
import { EventPattern, MessagePattern, Payload } from "@nestjs/microservices";
import { UserService } from "../../users/application/User.service";
import { User } from "../../users/domain/User.entity";
import {
  NATS_MESSAGE_PATTERNS,
  NATS_PATTERNS,
} from "@libs/common/src/microservices";
import { Role } from "@libs/common/src/auth/enums/role.enum";

/**
 * Subscriber para procesar eventos y mensajes asíncronos de NATS.
 * Implementa patrones de consumo para comunicación entre microservicios.
 * @class
 * @description Maneja la comunicación asíncrona entre servicios mediante NATS
 */
@Injectable()
export class NatsSubscriber implements OnModuleInit {
  private readonly logger = new Logger(NatsSubscriber.name);

  /**
   * Crea una instancia del suscriptor de NATS.
   * @param {UserService} userService - Servicio para operaciones de usuarios
   */
  constructor(private readonly userService: UserService) {}

  /**
   * Se ejecuta cuando el módulo se inicializa
   * @returns {Promise<void>} Promesa que se resuelve cuando el módulo está inicializado
   */
  async onModuleInit() {
    try {
      this.logger.log(`NATS Ready - Servicio iniciado y handlers registrados`);
    } catch (error: unknown) {
      this.logger.error(
        "Error en la inicialización de handlers NATS",
        error instanceof Error ? error.stack : "Error desconocido",
      );
    }
  }

  /**
   * Procesa eventos de creación de usuarios.
   * @param {Record<string, unknown>} data - Datos del usuario creado (id, email, name, roles)
   * @returns {void}
   */
  @EventPattern(NATS_PATTERNS.USER.CREATED)
  handleUserCreated(@Payload() data: Record<string, unknown>): void {}

  /**
   * Procesa eventos de registro de usuarios y almacena la información en la base de datos.
   * @param {Record<string, unknown>} data - Datos del usuario registrado (id, email, name, roles, createdAt)
   * @returns {Promise<void>} Promesa que se resuelve cuando el evento ha sido procesado
   */
  @EventPattern(NATS_PATTERNS.USER.REGISTERED)
  async handleUserRegistered(
    @Payload() data: Record<string, unknown>,
  ): Promise<void> {
    try {
      const email = data.email as string;
      const existingUser = await this.userService.findByEmail(email);

      if (!existingUser) {
        const user = new User(
          undefined as unknown as string,
          email,
          data.name as string,
          data.name as string,
          Array.isArray(data.roles) ? (data.roles as Role[]) : [Role.DEFAULT],
        );
        const tempPasswordHash = await require("bcrypt").hash(
          "temp-" + Date.now(),
          10,
        );
        await this.userService.createUser(user, "", tempPasswordHash);

        this.logger.log(`Usuario creado: ${email}`);
      }
    } catch (error) {
      this.logger.error(
        `Error procesando evento de registro: ${error instanceof Error ? error.message : "Error desconocido"}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  /**
   * Busca un usuario por su dirección de correo electrónico.
   * @param {Object} data - Objeto conteniendo el email del usuario
   * @param {string} data.email - Email del usuario a buscar
   * @returns {Promise<unknown>} El documento de usuario encontrado o null
   * @throws {Error} Si ocurre un error durante la búsqueda
   */
  @MessagePattern(NATS_MESSAGE_PATTERNS.USER.FIND_BY_EMAIL)
  async findUserByEmail(@Payload() data: { email: string }): Promise<unknown> {
    try {
      const user = await this.userService.findByEmail(data.email);
      return user;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Error en ${NATS_MESSAGE_PATTERNS.USER.FIND_BY_EMAIL}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Crea un nuevo usuario en el sistema a través de un mensaje NATS.
   * Procesa la solicitud de creación y devuelve el usuario creado con su ID generado por MongoDB.
   *
   * @param {Object} data - Datos necesarios para crear un usuario
   * @param {string} data.email - Email del usuario
   * @param {string} data.name - Nombre del usuario
   * @param {string} data.passwordHash - Hash de la contraseña
   * @param {string[]} data.roles - Roles asignados al usuario
   * @param {boolean} data.isActive - Estado de activación del usuario
   * @returns {Promise<unknown>} Usuario creado con su ID asignado por MongoDB
   * @throws {BadRequestException} Si el email ya está registrado
   * @throws {Error} Si ocurre otro error durante la creación
   */
  @MessagePattern(NATS_MESSAGE_PATTERNS.USER.CREATE)
  async createUser(
    @Payload()
    data: {
      email: string;
      name: string;
      passwordHash: string;
      roles: string[];
      isActive: boolean;
    },
  ): Promise<unknown> {
    try {
      const existingUser = await this.userService.findByEmail(data.email);
      if (existingUser) {
        throw new BadRequestException(
          `El email ${data.email} ya está registrado`,
        );
      }

      const user = new User(
        undefined as unknown as string,
        data.email,
        data.email.split("@")[0],
        data.name,
        Array.isArray(data.roles) ? (data.roles as Role[]) : [Role.DEFAULT],
      );

      const result = await this.userService.createUser(
        user,
        "",
        data.passwordHash,
      );

      this.logger.log(`Usuario creado: ${data.email}`);
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Error en ${NATS_MESSAGE_PATTERNS.USER.CREATE}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Busca un usuario por su identificador único.
   * @param {Object} data - Objeto conteniendo el ID del usuario
   * @param {string} data.id - ID del usuario a buscar
   * @returns {Promise<unknown>} El documento de usuario encontrado o null
   */
  @MessagePattern(NATS_MESSAGE_PATTERNS.USER.FIND_BY_ID)
  async findUserById(@Payload() data: { id: string }): Promise<unknown> {
    try {
      const user = await this.userService.findById(data.id);
      return user;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Error en ${NATS_MESSAGE_PATTERNS.USER.FIND_BY_ID}: ${errorMessage}`,
        errorStack,
      );
      return null;
    }
  }

  /**
   * Actualiza la contraseña de un usuario.
   * @param {Object} data - Objeto con datos para actualizar la contraseña
   * @param {string} data.id - ID del usuario
   * @param {string} data.passwordHash - Nuevo hash de contraseña
   * @returns {Promise<unknown>} Resultado de la operación de actualización
   * @throws {Error} Si ocurre un error durante la actualización
   */
  @MessagePattern(NATS_MESSAGE_PATTERNS.USER.UPDATE_PASSWORD)
  async updatePassword(
    @Payload() data: { id: string; passwordHash: string },
  ): Promise<unknown> {
    try {
      const result = await this.userService.updatePassword(
        data.id,
        data.passwordHash,
      );
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Error en ${NATS_MESSAGE_PATTERNS.USER.UPDATE_PASSWORD}: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
