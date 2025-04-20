import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { CacheService } from "./Cache.service";
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiResponse,
} from "@nestjs/swagger";

/**
 * Controlador para operaciones de caché.
 * Proporciona endpoints para almacenar y recuperar valores en caché.
 */
@ApiTags("Cache")
@Controller("cache")
export class CacheController {
  /**
   * Constructor del controlador de caché.
   * @param {CacheService} cacheService - Servicio de caché
   */
  constructor(private readonly cacheService: CacheService) {}

  /**
   * Almacena un valor en la caché con la clave especificada.
   * @param {string} key - Clave única para almacenar el valor
   * @param {any} body - Cuerpo de la solicitud que contiene el valor a almacenar
   * @returns {Object} Resultado de la operación con mensaje de confirmación
   */
  @Post(":key")
  @ApiOperation({
    summary: "Almacenar valor en caché",
    description: "Guarda un valor en la caché utilizando la clave especificada",
  })
  @ApiParam({
    name: "key",
    description: "Clave única para identificar el valor en caché",
    required: true,
    type: String,
    example: "user_preferences",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["value"],
      properties: {
        value: {
          type: "object",
          example: {
            theme: "dark",
            language: "es",
            notifications: true,
          },
          description:
            "Valor a almacenar en caché (puede ser cualquier tipo de dato)",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Valor almacenado correctamente",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Value cached for key: user_preferences",
        },
      },
    },
  })
  set(@Param("key") key: string, @Body() body: any) {
    this.cacheService.set(key, body.value);
    return { message: `Value cached for key: ${key}` };
  }

  /**
   * Recupera un valor de la caché por su clave.
   * @param {string} key - Clave a buscar en la caché
   * @returns {Object} Objeto que contiene el valor almacenado o undefined si no se encuentra
   */
  @Get(":key")
  @ApiOperation({
    summary: "Obtener valor de caché",
    description: "Recupera un valor almacenado en caché mediante su clave",
  })
  @ApiParam({
    name: "key",
    description: "Clave del valor a recuperar",
    required: true,
    type: String,
    example: "user_preferences",
  })
  @ApiResponse({
    status: 200,
    description: "Valor recuperado correctamente",
    schema: {
      type: "object",
      properties: {
        value: {
          type: "object",
          example: {
            theme: "dark",
            language: "es",
            notifications: true,
          },
          description:
            "Valor almacenado en caché o undefined si la clave no existe",
        },
      },
    },
  })
  get(@Param("key") key: string) {
    return { value: this.cacheService.get(key) };
  }
}
