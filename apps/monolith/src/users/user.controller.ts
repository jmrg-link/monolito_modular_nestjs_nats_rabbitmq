/**
 * @fileoverview Controlador de usuarios para la gestión administrativa
 * @module Users/Controllers
 * @description Implementa endpoints protegidos para operaciones CRUD y búsquedas de usuarios.
 * Utiliza JWT y roles para autorización y DTOs para validación de datos.
 */
import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { UserService } from "./application/User.service";
import { User } from "./domain/User.entity";
import { JwtAuthGuard, RolesGuard, Roles } from "@libs/common/src/auth";
import { PaginationOptions } from "@libs/common/src/interfaces";
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import {
  ApiPaginated,
  ApiCreate,
  ApiGetById,
  ApiDelete,
} from "@libs/common/src/decorators";
import { CreateUserDto } from "./application/CreateUser.dto";
import { UpdateUserDto } from "./application/UpdateUser.dto";
import { Role } from "@libs/common/src/auth/enums/role.enum";
import { Address } from "./infrastructure/User.schema";

/**
 * Controlador para gestionar operaciones de usuarios con autorización por roles
 * @class UserController
 * @public
 */
@ApiTags("Usuarios")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("access-token")
export class UserController {
  /**
   * @constructor
   * @param {UserService} userService - Servicio de usuarios para lógica de negocio
   */
  constructor(private readonly userService: UserService) {}

  /**
   * @public
   * @param {number} page - Número de página
   * @param {number} limit - Límite de resultados por página
   * @param {string} [sortBy] - Campo por el cual ordenar
   * @param {"asc" | "desc"} [sortDirection] - Dirección del ordenamiento
   * @returns {Promise<PaginatedResult<User>>} Resultado paginado de usuarios
   * @description Obtiene todos los usuarios con paginación con los siguientes paramametros : page , limit, sortBy, sortDirection.
   */
  @Get()
  @Roles("admin")
  @ApiPaginated(
    "Usuarios",
    "Listar usuarios",
    "Recupera la lista de usuarios con soporte para paginación, ordenamiento y filtraje",
  )
  @ApiResponse({
    status: 200,
    description: "Listado de usuarios recuperado correctamente",
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", example: "645a1234abcde1234567890" },
              email: { type: "string", example: "usuario@ejemplo.com" },
              name: { type: "string", example: "Juan Pérez" },
              roles: {
                type: "array",
                items: { type: "string" },
                example: ["user"],
              },
              isActive: { type: "boolean", example: true },
              lastLoginAt: {
                type: "string",
                format: "date-time",
                example: "2023-05-08T18:22:45.678Z",
              },
              createdAt: {
                type: "string",
                format: "date-time",
                example: "2023-05-01T12:34:56.789Z",
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                example: "2023-05-08T18:22:45.678Z",
              },
            },
          },
        },
        meta: {
          type: "object",
          properties: {
            totalItems: { type: "number", example: 124 },
            itemCount: { type: "number", example: 10 },
            itemsPerPage: { type: "number", example: 10 },
            totalPages: { type: "number", example: 13 },
            currentPage: { type: "number", example: 1 },
          },
        },
      },
    },
  })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query("sortBy") sortBy?: string,
    @Query("sortDirection") sortDirection?: "asc" | "desc",
  ) {
    const options: PaginationOptions = {
      page,
      limit,
      sortBy,
      sortDirection: sortDirection || "desc",
    };

    return this.userService.findWithPagination(options);
  }

  /**
   * Obtiene un usuario por su ID
   * @public
   * @param {string} id - Identificador único del usuario
   * @returns {Promise<User>} Usuario encontrado
   */
  @Get(":id")
  @Roles("admin")
  @ApiGetById(
    "Usuarios",
    "Obtener usuario por ID",
    "Recupera la información detallada de un usuario mediante su identificador único",
  )
  @ApiResponse({
    status: 200,
    description: "Usuario encontrado",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645a1234abcde1234567890" },
        email: { type: "string", example: "usuario@ejemplo.com" },
        name: { type: "string", example: "Juan Pérez" },
        roles: {
          type: "array",
          items: { type: "string" },
          example: ["user"],
        },
        isActive: { type: "boolean", example: true },
        lastLoginAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-08T18:22:45.678Z",
        },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-01T12:34:56.789Z",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-08T18:22:45.678Z",
        },
      },
    },
  })
  async findById(@Param("id") id: string) {
    return this.userService.findById(id);
  }

  /**
   * Crea un nuevo usuario
   * @public
   * @param {CreateUserDto} createUserDto - Datos del usuario a crear
   * @returns {Promise<User>} Usuario creado
   */
  @Post()
  @Roles("admin")
  @ApiCreate(
    "Usuarios",
    "Crear nuevo usuario",
    "Registra un nuevo usuario en el sistema con los roles especificados",
  )
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: "Usuario creado exitosamente",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645f5678defgh9012345678" },
        email: { type: "string", example: "nuevo@ejemplo.com" },
        name: { type: "string", example: "Ana" },
        lastname: { type: "string", example: "López" },
        roles: {
          type: "array",
          items: { type: "string" },
          example: ["user"],
        },
        isActive: { type: "boolean", example: true },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-13T09:12:34.567Z",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-13T09:12:34.567Z",
        },
      },
    },
  })
  async create(@Body() createUserDto: CreateUserDto) {
    const user = new User(
      createUserDto.name,
      createUserDto.lastName,
      createUserDto.email,
      undefined,
    );
    return this.userService.createUser(user, createUserDto.password);
  }

  /**
   * Actualiza un usuario existente
   * @public
   * @param {string} id - Identificador único del usuario
   * @param {UpdateUserDto} updateUserDto - Datos a actualizar
   * @returns {Promise<User>} Usuario actualizado
   */
  @Put(":id")
  @Roles("admin")
  @ApiOperation({
    summary: "Actualizar usuario",
    description: "Modifica los datos de un usuario existente",
  })
  @ApiParam({
    name: "id",
    description: "Identificador único del usuario",
    required: true,
    type: String,
    example: "645a1234abcde1234567890",
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: "Usuario actualizado correctamente",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645a1234abcde1234567890" },
        email: { type: "string", example: "juanperez@ejemplo.com" },
        name: { type: "string", example: "Juan Carlos Pérez" },
        roles: {
          type: "array",
          items: { type: "string" },
          example: ["user", "staff"],
        },
        isActive: { type: "boolean", example: true },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-13T10:45:22.789Z",
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Usuario no encontrado" })
  async update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.updateUser(id, updateUserDto);
  }

  /**
   * @public
   * @param {string} id - Identificador único del usuario
   * @returns {Promise<void>} Resultado de la operación
   * @description Elimina un usuario del sistema
   */
  @Delete(":id")
  @Roles("admin")
  @ApiDelete(
    "Usuarios",
    "Eliminar usuario",
    "Elimina permanentemente un usuario del sistema",
  )
  async delete(@Param("id") id: string) {
    return this.userService.deleteUser(id);
  }

  /**
   * Desactiva un usuario
   * @public
   * @param {string} id - Identificador único del usuario
   * @returns {Promise<object>} Usuario desactivado con mensaje de confirmación
   */
  @Put(":id/deactivate")
  @Roles("admin")
  @ApiOperation({
    summary: "Desactivar usuario",
    description:
      "Marca un usuario como inactivo, impidiendo su acceso al sistema",
  })
  @ApiParam({
    name: "id",
    description: "Identificador único del usuario",
    required: true,
    type: String,
    example: "645a1234abcde1234567890",
  })
  @ApiResponse({
    status: 200,
    description: "Usuario desactivado correctamente",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645a1234abcde1234567890" },
        isActive: { type: "boolean", example: false },
        message: {
          type: "string",
          example: "Usuario desactivado correctamente",
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Usuario no encontrado" })
  async deactivate(@Param("id") id: string) {
    return this.userService.deactivateUser(id);
  }

  /**
   * Activa un usuario
   * @public
   * @param {string} id - Identificador único del usuario
   * @returns {Promise<object>} Usuario activado con mensaje de confirmación
   */
  @Put(":id/activate")
  @Roles("admin")
  @ApiOperation({
    summary: "Activar usuario",
    description:
      "Marca un usuario como activo, permitiendo su acceso al sistema",
  })
  @ApiParam({
    name: "id",
    description: "Identificador único del usuario",
    required: true,
    type: String,
    example: "645a1234abcde1234567890",
  })
  @ApiResponse({
    status: 200,
    description: "Usuario activado correctamente",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645a1234abcde1234567890" },
        isActive: { type: "boolean", example: true },
        message: { type: "string", example: "Usuario activado correctamente" },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Usuario no encontrado" })
  async activate(@Param("id") id: string) {
    return this.userService.activateUser(id);
  }

  /**
   * Busca usuarios por término
   * @public
   * @param {string} term - Término de búsqueda
   * @returns {Promise<User[]>} Lista de usuarios que coinciden con el término
   */
  @Get("search/term")
  @Roles("admin")
  @ApiOperation({
    summary: "Buscar usuarios",
    description:
      "Busca usuarios que coincidan con el término en nombre o email",
  })
  @ApiQuery({
    name: "term",
    description: "Término de búsqueda",
    required: true,
    type: String,
    example: "juan",
  })
  @ApiResponse({
    status: 200,
    description: "Resultados de la búsqueda",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", example: "645a1234abcde1234567890" },
          email: { type: "string", example: "juanperez@ejemplo.com" },
          name: { type: "string", example: "Juan Carlos Pérez" },
          roles: {
            type: "array",
            items: { type: "string" },
            example: ["user", "staff"],
          },
          isActive: { type: "boolean", example: true },
        },
      },
    },
  })
  async searchUsers(@Query("term") term: string) {
    return this.userService.searchUsers(term);
  }

  /**
   * Obtiene usuarios por rol
   * @public
   * @param {string} role - Rol a buscar
   * @returns {Promise<User[]>} Lista de usuarios con el rol especificado
   */
  @Get("role/:role")
  @Roles("admin")
  @ApiOperation({
    summary: "Obtener usuarios por rol",
    description:
      "Recupera todos los usuarios que tienen asignado un rol específico",
  })
  @ApiParam({
    name: "role",
    description: "Rol a buscar",
    required: true,
    type: String,
    example: "admin",
  })
  @ApiResponse({
    status: 200,
    description: "Usuarios con el rol especificado",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", example: "645a1234abcde1234567890" },
          email: { type: "string", example: "admin@ejemplo.com" },
          name: { type: "string", example: "Administrador Principal" },
          roles: {
            type: "array",
            items: { type: "string" },
            example: ["admin", "user"],
          },
          isActive: { type: "boolean", example: true },
        },
      },
    },
  })
  async findByRole(@Param("role") role: string) {
    return this.userService.findByRole(role);
  }
}
