import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
  ApiHeader,
  ApiQuery,
} from "@nestjs/swagger";

/**
 * Decorador para documentar endpoints de autenticación genéricos
 * @param {string} summary - Título breve de la operación
 * @param {string} description - Descripción detallada de la operación
 * @returns {MethodDecorator} Decorador compuesto para Swagger
 */
export function ApiAuth(summary: string, description: string) {
  return applyDecorators(
    ApiTags("Autenticación"),
    ApiOperation({
      summary,
      description,
    }),
    ApiResponse({
      status: 200,
      description: "Operación exitosa",
    }),
    ApiResponse({
      status: 401,
      description: "No autorizado - Credenciales inválidas o token expirado",
    }),
    ApiResponse({
      status: 500,
      description: "Error interno del servidor",
    }),
  );
}

/**
 * Decorador para documentar endpoints protegidos que requieren autenticación
 * @param {string} tag - Etiqueta para agrupar endpoints
 * @param {string} summary - Título breve de la operación
 * @param {string} description - Descripción detallada de la operación
 * @returns {MethodDecorator} Decorador compuesto para Swagger
 */
export function ApiProtected(
  tag: string,
  summary: string,
  description: string,
) {
  return applyDecorators(
    ApiTags(tag),
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary,
      description,
    }),
    ApiHeader({
      name: "Authorization",
      description: "JWT token de acceso (Bearer)",
      required: true,
      schema: {
        type: "string",
        example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    }),
    ApiResponse({
      status: 200,
      description: "Operación exitosa",
    }),
    ApiResponse({
      status: 401,
      description: "No autorizado - Token inválido o expirado",
    }),
    ApiResponse({
      status: 403,
      description: "Prohibido - No tiene permisos para realizar esta acción",
    }),
    ApiResponse({
      status: 500,
      description: "Error interno del servidor",
    }),
  );
}

/**
 * Decorador para el endpoint de inicio de sesión
 * Incluye esquema de respuesta con tokens y datos del usuario
 * @returns {MethodDecorator} Decorador compuesto para Swagger
 */
export function ApiLogin() {
  return applyDecorators(
    ApiTags("Autenticación"),
    ApiOperation({
      summary: "Iniciar sesión",
      description:
        "Autentica al usuario y devuelve tokens JWT de acceso y refresco",
    }),
    ApiBody({
      required: true,
      description: "Credenciales de usuario",
      schema: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "usuario@ejemplo.com",
            description: "Correo electrónico registrado del usuario",
          },
          password: {
            type: "string",
            example: "Contraseña123",
            description: "Contraseña del usuario",
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Autenticación exitosa",
      schema: {
        type: "object",
        properties: {
          accessToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          refreshToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          expiresIn: { type: "number", example: 3600 },
          user: {
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
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Credenciales inválidas",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 401 },
          message: { type: "string", example: "Credenciales inválidas" },
          error: { type: "string", example: "Unauthorized" },
        },
      },
    }),
  );
}

/**
 * Decorador para el endpoint de registro de usuarios
 * Incluye esquema de respuesta con tokens y datos del usuario creado
 * @returns {MethodDecorator} Decorador compuesto para Swagger
 */
export function ApiRegister() {
  return applyDecorators(
    ApiTags("Autenticación"),
    ApiOperation({
      summary: "Registrar usuario",
      description: "Crea una nueva cuenta de usuario en el sistema",
    }),
    ApiBody({
      required: true,
      description: "Datos para registro de usuario",
      schema: {
        type: "object",
        required: ["email", "name", "password"],
        properties: {
          email: {
            type: "string",
            format: "email",
            example: "nuevo@ejemplo.com",
            description: "Correo electrónico para la nueva cuenta",
          },
          name: {
            type: "string",
            example: "Ana López",
            description: "Nombre completo del usuario",
          },
          password: {
            type: "string",
            example: "Contraseña123",
            description: "Contraseña segura (mínimo 6 caracteres)",
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "Usuario registrado exitosamente",
      schema: {
        type: "object",
        properties: {
          accessToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          refreshToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
          expiresIn: { type: "number", example: 3600 },
          user: {
            type: "object",
            properties: {
              id: { type: "string", example: "645a1234abcde1234567890" },
              email: { type: "string", example: "nuevo@ejemplo.com" },
              name: { type: "string", example: "Ana López" },
              roles: {
                type: "array",
                items: { type: "string" },
                example: ["user"],
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Datos inválidos o el email ya está registrado",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "El email ya está registrado" },
          error: { type: "string", example: "Bad Request" },
        },
      },
    }),
  );
}

/**
 * Decorador para el endpoint de renovación de token
 * Incluye esquema de respuesta con el nuevo token de acceso
 * @returns {MethodDecorator} Decorador compuesto para Swagger
 */
export function ApiRefreshToken() {
  return applyDecorators(
    ApiTags("Autenticación"),
    ApiOperation({
      summary: "Renovar token",
      description:
        "Genera un nuevo token de acceso utilizando un token de refresco válido",
    }),
    ApiBody({
      required: true,
      description: "Token de refresco",
      schema: {
        type: "object",
        required: ["refreshToken"],
        properties: {
          refreshToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            description:
              "Token de refresco obtenido en el inicio de sesión o registro",
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Token renovado exitosamente",
      schema: {
        type: "object",
        properties: {
          accessToken: {
            type: "string",
            example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Token de refresco inválido o expirado",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 401 },
          message: { type: "string", example: "Token inválido o expirado" },
          error: { type: "string", example: "Unauthorized" },
        },
      },
    }),
  );
}

/**
 * Decorador para el endpoint de perfil de usuario
 * Incluye esquema de respuesta con los datos del perfil
 * @returns {MethodDecorator} Decorador compuesto para Swagger
 */
export function ApiProfile() {
  return applyDecorators(
    ApiTags("Autenticación"),
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Obtener perfil",
      description: "Devuelve la información del perfil del usuario autenticado",
    }),
    ApiHeader({
      name: "Authorization",
      description: "JWT token de acceso (Bearer)",
      required: true,
      schema: {
        type: "string",
        example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    }),
    ApiResponse({
      status: 200,
      description: "Perfil recuperado exitosamente",
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
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "No autorizado - Token inválido o expirado",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 401 },
          message: { type: "string", example: "Token inválido o expirado" },
          error: { type: "string", example: "Unauthorized" },
        },
      },
    }),
  );
}

/**
 * Decorador para el endpoint de cambio de contraseña
 * Incluye esquema de respuesta con mensaje de confirmación
 * @returns {MethodDecorator} Decorador compuesto para Swagger
 */
export function ApiChangePassword() {
  return applyDecorators(
    ApiTags("Autenticación"),
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Cambiar contraseña",
      description: "Actualiza la contraseña del usuario autenticado",
    }),
    ApiHeader({
      name: "Authorization",
      description: "JWT token de acceso (Bearer)",
      required: true,
      schema: {
        type: "string",
        example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    }),
    ApiBody({
      required: true,
      description: "Contraseñas actual y nueva",
      schema: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: {
            type: "string",
            example: "ContraseñaActual123",
            description: "Contraseña actual para verificación",
          },
          newPassword: {
            type: "string",
            example: "NuevaContraseña456",
            description: "Nueva contraseña (mínimo 6 caracteres)",
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Contraseña actualizada exitosamente",
      schema: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Contraseña actualizada correctamente",
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Contraseña actual incorrecta o usuario no autenticado",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 401 },
          message: { type: "string", example: "Contraseña actual incorrecta" },
          error: { type: "string", example: "Unauthorized" },
        },
      },
    }),
  );
}

/**
 * Decorador para endpoints paginados
 * @param {string} tag - Etiqueta para agrupar endpoints
 * @param {string} summary - Título breve de la operación
 * @param {string} description - Descripción detallada de la operación
 * @returns {MethodDecorator} Decorador compuesto para Swagger
 */
export function ApiPaginated(
  tag: string,
  summary: string,
  description: string,
) {
  return applyDecorators(
    ApiTags(tag),
    ApiOperation({
      summary,
      description,
    }),
    ApiQuery({
      name: "page",
      required: false,
      description: "Número de página (comienza en 1)",
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: "limit",
      required: false,
      description: "Cantidad de elementos por página",
      type: Number,
      example: 10,
    }),
    ApiQuery({
      name: "sortBy",
      required: false,
      description: "Campo por el cual ordenar",
      type: String,
      example: "createdAt",
    }),
    ApiQuery({
      name: "sortDirection",
      required: false,
      description: "Dirección del ordenamiento",
      enum: ["asc", "desc"],
      example: "desc",
    }),
    ApiResponse({
      status: 200,
      description: "Lista de recursos paginada",
    }),
  );
}

/**
 * Decorador para endpoints de creación
 * @param {string} tag - Etiqueta para agrupar endpoints
 * @param {string} summary - Título breve de la operación
 * @param {string} description - Descripción detallada de la operación
 * @returns {MethodDecorator} Decorador compuesto para Swagger
 */
export function ApiCreate(tag: string, summary: string, description: string) {
  return applyDecorators(
    ApiTags(tag),
    ApiOperation({
      summary,
      description,
    }),
    ApiResponse({
      status: 201,
      description: "Recurso creado exitosamente",
    }),
    ApiResponse({
      status: 400,
      description: "Datos inválidos",
    }),
  );
}

/**
 * Decorador para endpoints de obtención por ID
 * @param {string} tag - Etiqueta para agrupar endpoints
 * @param {string} summary - Título breve de la operación
 * @param {string} description - Descripción detallada de la operación
 * @returns {MethodDecorator} Decorador compuesto para Swagger
 */
export function ApiGetById(tag: string, summary: string, description: string) {
  return applyDecorators(
    ApiTags(tag),
    ApiOperation({
      summary,
      description,
    }),
    ApiParam({
      name: "id",
      description: "Identificador único del recurso",
      type: String,
      required: true,
      example: "645a7594e21e1b4801d45432",
    }),
    ApiResponse({
      status: 200,
      description: "Recurso encontrado",
    }),
    ApiResponse({
      status: 404,
      description: "Recurso no encontrado",
    }),
  );
}

/**
 * Decorador para endpoints de eliminación
 * @param {string} tag - Etiqueta para agrupar endpoints
 * @param {string} summary - Título breve de la operación
 * @param {string} description - Descripción detallada de la operación
 * @returns {MethodDecorator} Decorador compuesto para Swagger
 */
export function ApiDelete(tag: string, summary: string, description: string) {
  return applyDecorators(
    ApiTags(tag),
    ApiOperation({
      summary,
      description,
    }),
    ApiParam({
      name: "id",
      description: "Identificador único del recurso a eliminar",
      type: String,
      required: true,
      example: "645a7594e21e1b4801d45432",
    }),
    ApiResponse({
      status: 200,
      description: "Recurso eliminado correctamente",
    }),
    ApiResponse({
      status: 404,
      description: "Recurso no encontrado",
    }),
  );
}

/**
 * Decorador para endpoints públicos
 * @param {string} tag - Etiqueta para agrupar endpoints
 * @param {string} summary - Título breve de la operación
 * @param {string} description - Descripción detallada de la operación
 * @returns {MethodDecorator} Decorador compuesto para Swagger
 */
export function ApiPublic(tag: string, summary: string, description: string) {
  return applyDecorators(
    ApiTags(tag),
    ApiOperation({
      summary,
      description,
    }),
    ApiResponse({
      status: 200,
      description: "Operación exitosa",
    }),
  );
}

/**
 * Decorador para endpoints de comprobación de estado (health check)
 * Configura documentación Swagger para endpoints de monitoreo de salud
 * @returns {MethodDecorator} Decorador compuesto para Swagger
 */
export function ApiHealth() {
  return applyDecorators(
    ApiTags("Sistema"),
    ApiOperation({
      summary: "Verificar estado",
      description: "Comprueba el estado y funcionamiento del servicio",
    }),
    ApiResponse({
      status: 200,
      description: "Servicio funcionando correctamente",
      schema: {
        type: "object",
        properties: {
          estado: { type: "string", example: "ok" },
          servicio: { type: "string", example: "monolito" },
          memoria: {
            type: "object",
            properties: {
              rss: { type: "number", example: 76488704 },
              heapTotal: { type: "number", example: 23068672 },
              heapUsed: { type: "number", example: 15475216 },
              external: { type: "number", example: 1829611 },
            },
          },
          uptime: { type: "number", example: 3600.212 },
          timestamp: {
            type: "string",
            format: "date-time",
            example: "2023-05-15T14:32:28.123Z",
          },
        },
      },
    }),
  );
}
