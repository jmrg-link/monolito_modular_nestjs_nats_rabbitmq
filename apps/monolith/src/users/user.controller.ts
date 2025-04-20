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
  ApiProtected,
  ApiAuth,
} from "@libs/common/src/decorators";

/**
 * Controlador de usuarios.
 * Gestiona todas las operaciones relacionadas con los usuarios del sistema.
 */
@ApiTags("Usuarios")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("access-token")
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Obtiene todos los usuarios con paginación.
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
   * Obtiene un usuario por ID.
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
   * Crea un usuario y publica eventos.
   */
  @Post()
  @Roles("admin")
  @ApiCreate(
    "Usuarios",
    "Crear nuevo usuario",
    "Registra un nuevo usuario en el sistema con los roles especificados",
  )
  @ApiBody({
    schema: {
      type: "object",
      required: ["email", "name", "password"],
      properties: {
        email: { type: "string", example: "nuevo@ejemplo.com" },
        name: { type: "string", example: "Ana López" },
        password: { type: "string", example: "Contraseña123" },
        roles: {
          type: "array",
          items: { type: "string" },
          example: ["user"],
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Usuario creado exitosamente",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645f5678defgh9012345678" },
        email: { type: "string", example: "nuevo@ejemplo.com" },
        name: { type: "string", example: "Ana López" },
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
  async create(
    @Body()
    body: {
      email: string;
      name: string;
      password: string;
      roles?: string[];
    },
  ) {
    const user = new User(
      Date.now().toString(),
      body.email,
      body.name,
      Array.isArray(body.roles) ? body.roles : ["user"],
    );
    return this.userService.createUser(user, body.password);
  }

  /**
   * Actualiza un usuario.
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
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "Juan Carlos Pérez" },
        email: { type: "string", example: "juanperez@ejemplo.com" },
        roles: {
          type: "array",
          items: { type: "string" },
          example: ["user", "staff"],
        },
        isActive: { type: "boolean", example: true },
      },
    },
  })
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
  async update(
    @Param("id") id: string,
    @Body()
    body: Partial<{
      name: string;
      email: string;
      roles: string[];
      isActive: boolean;
    }>,
  ) {
    return this.userService.updateUser(id, body);
  }

  /**
   * Elimina un usuario.
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
   * Desactiva un usuario.
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
   * Activa un usuario.
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
   * Busca usuarios por nombre o email.
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
   * Obtiene usuarios por rol.
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
