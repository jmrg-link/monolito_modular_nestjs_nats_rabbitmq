import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Put,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import { OrderService } from "./application/Order.service";
import { Order } from "./domain/Order.entity";
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard, RolesGuard, Roles } from "@libs/common/src/auth";
import {
  ApiPaginated,
  ApiCreate,
  ApiGetById,
  ApiDelete,
  ApiProtected,
} from "@libs/common/src/decorators";

/**
 * Controlador de órdenes para gestión de pedidos en el sistema.
 * Proporciona operaciones CRUD y funcionalidades específicas relacionadas con pedidos.
 */
@ApiTags("Pedidos")
@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth("access-token")
export class OrderController {
  /**
   * Constructor del controlador de órdenes.
   * @param {OrderService} orderService - Servicio de gestión de órdenes
   */
  constructor(private readonly orderService: OrderService) {}

  /**
   * Obtiene todas las órdenes con paginación opcional.
   * @param {number} page - Número de página para la paginación
   * @param {number} limit - Cantidad de elementos por página
   * @param {string} sortBy - Campo por el cual ordenar los resultados
   * @param {string} order - Dirección del ordenamiento (asc o desc)
   * @returns {Promise<PaginatedResult<Order>>} Lista paginada de órdenes
   */
  @Get()
  @Roles("admin", "staff")
  @ApiPaginated(
    "Pedidos",
    "Listar todas las órdenes",
    "Obtiene el listado de órdenes con soporte para paginación, ordenamiento y filtrado",
  )
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Número de página",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Elementos por página",
    example: 10,
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    type: String,
    description: "Campo para ordenar",
    example: "createdAt",
  })
  @ApiQuery({
    name: "order",
    required: false,
    type: String,
    description: "Dirección del ordenamiento",
    example: "desc",
    enum: ["asc", "desc"],
  })
  @ApiResponse({
    status: 200,
    description: "Listado de órdenes recuperado correctamente",
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", example: "645a7594e21e1b4801d45432" },
              userId: { type: "string", example: "645a1234abcde1234567890" },
              total: { type: "number", example: 249.99 },
              products: {
                type: "array",
                items: { type: "string" },
                example: [
                  "645b8790a23d1b4801d12345",
                  "645b8905c21e1b4801d67890",
                ],
              },
              status: {
                type: "string",
                example: "pending",
                enum: [
                  "pending",
                  "processing",
                  "shipped",
                  "delivered",
                  "cancelled",
                ],
              },
              paidAt: {
                type: "string",
                format: "date-time",
                example: "2023-05-09T15:30:45.123Z",
              },
              createdAt: {
                type: "string",
                format: "date-time",
                example: "2023-05-09T14:25:08.987Z",
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                example: "2023-05-09T15:30:45.123Z",
              },
            },
          },
        },
        meta: {
          type: "object",
          properties: {
            totalItems: { type: "number", example: 48 },
            itemCount: { type: "number", example: 10 },
            itemsPerPage: { type: "number", example: 10 },
            totalPages: { type: "number", example: 5 },
            currentPage: { type: "number", example: 1 },
          },
        },
      },
    },
  })
  async findAll(
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query("sortBy") sortBy: string = "createdAt",
    @Query("order") order: "asc" | "desc" = "desc",
  ) {
    const options = { page, limit, sortBy, sortDirection: order };
    return this.orderService.findAll(options);
  }

  /**
   * Obtiene una orden por su ID.
   * @param {string} id - Identificador único de la orden
   * @returns {Promise<Order>} Orden encontrada
   */
  @Get(":id")
  @Roles("admin", "staff", "user")
  @ApiGetById(
    "Pedidos",
    "Obtener pedido por ID",
    "Recupera una orden específica por su identificador único",
  )
  @ApiParam({
    name: "id",
    description: "Identificador único de la orden",
    required: true,
    type: String,
    example: "645a7594e21e1b4801d45432",
  })
  @ApiResponse({
    status: 200,
    description: "Orden encontrada",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645a7594e21e1b4801d45432" },
        userId: { type: "string", example: "645a1234abcde1234567890" },
        total: { type: "number", example: 249.99 },
        products: {
          type: "array",
          items: { type: "string" },
          example: ["645b8790a23d1b4801d12345", "645b8905c21e1b4801d67890"],
        },
        status: {
          type: "string",
          example: "pending",
          enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
        },
        paidAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-09T15:30:45.123Z",
        },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-09T14:25:08.987Z",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-09T15:30:45.123Z",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Orden no encontrada",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 404 },
        message: {
          type: "string",
          example: "Orden con ID 645a7594e21e1b4801d45432 no encontrada",
        },
        error: { type: "string", example: "Not Found" },
      },
    },
  })
  async findById(@Param("id") id: string) {
    return this.orderService.findById(id);
  }

  /**
   * Crea una nueva orden.
   * @param {Object} body - Datos de la orden
   * @param {string} body.userId - ID del usuario que realiza la orden
   * @param {number} body.total - Importe total de la orden
   * @param {string[]} [body.products] - IDs de los productos incluidos en la orden
   * @returns {Promise<Order>} Orden creada
   */
  @Post()
  @Roles("admin", "user")
  @ApiCreate(
    "Pedidos",
    "Crear nueva orden",
    "Registra una nueva orden en el sistema",
  )
  @ApiBody({
    schema: {
      type: "object",
      required: ["userId", "total"],
      properties: {
        userId: {
          type: "string",
          example: "645a1234abcde1234567890",
          description: "ID del usuario que realiza la orden",
        },
        total: {
          type: "number",
          example: 249.99,
          description: "Importe total de la orden",
        },
        products: {
          type: "array",
          items: { type: "string" },
          example: ["645b8790a23d1b4801d12345", "645b8905c21e1b4801d67890"],
          description: "Array de IDs de productos incluidos en la orden",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Orden creada exitosamente",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645a7594e21e1b4801d45432" },
        userId: { type: "string", example: "645a1234abcde1234567890" },
        total: { type: "number", example: 249.99 },
        products: {
          type: "array",
          items: { type: "string" },
          example: ["645b8790a23d1b4801d12345", "645b8905c21e1b4801d67890"],
        },
        status: { type: "string", example: "pending" },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-09T14:25:08.987Z",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-09T14:25:08.987Z",
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Datos inválidos",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 400 },
        message: {
          type: "array",
          items: { type: "string" },
          example: ["El total debe ser un número positivo"],
        },
        error: { type: "string", example: "Bad Request" },
      },
    },
  })
  async create(
    @Body() body: { userId: string; total: number; products?: string[] },
  ) {
    const order = new Order(Date.now().toString(), body.userId, body.total);
    return this.orderService.createOrder(order, body.products);
  }

  /**
   * Actualiza una orden existente.
   * @param {string} id - Identificador único de la orden
   * @param {Object} body - Datos a actualizar
   * @returns {Promise<Order>} Orden actualizada
   */
  @Put(":id")
  @Roles("admin", "staff")
  @ApiOperation({
    summary: "Actualizar orden",
    description: "Actualiza los datos de una orden existente",
  })
  @ApiParam({
    name: "id",
    description: "Identificador único de la orden",
    required: true,
    type: String,
    example: "645a7594e21e1b4801d45432",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        total: {
          type: "number",
          example: 259.99,
          description: "Nuevo importe total de la orden",
        },
        products: {
          type: "array",
          items: { type: "string" },
          example: [
            "645b8790a23d1b4801d12345",
            "645b8905c21e1b4801d67890",
            "645b9016e21e1b4801d89012",
          ],
          description: "Listado actualizado de IDs de productos",
        },
        status: {
          type: "string",
          example: "processing",
          enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
          description: "Nuevo estado de la orden",
        },
        paidAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-09T15:30:45.123Z",
          description: "Fecha y hora de pago (si aplica)",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Orden actualizada correctamente",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645a7594e21e1b4801d45432" },
        userId: { type: "string", example: "645a1234abcde1234567890" },
        total: { type: "number", example: 259.99 },
        products: {
          type: "array",
          items: { type: "string" },
          example: [
            "645b8790a23d1b4801d12345",
            "645b8905c21e1b4801d67890",
            "645b9016e21e1b4801d89012",
          ],
        },
        status: { type: "string", example: "processing" },
        paidAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-09T15:30:45.123Z",
        },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-09T14:25:08.987Z",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-09T15:45:22.456Z",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Orden no encontrada",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 404 },
        message: {
          type: "string",
          example: "Orden con ID 645a7594e21e1b4801d45432 no encontrada",
        },
        error: { type: "string", example: "Not Found" },
      },
    },
  })
  async update(
    @Param("id") id: string,
    @Body()
    body: Partial<{
      userId: string;
      total: number;
      products: string[];
      status: string;
      paidAt: Date;
    }>,
  ) {
    return this.orderService.updateOrder(id, body);
  }

  /**
   * Elimina una orden.
   * @param {string} id - Identificador único de la orden
   * @returns {Promise<Order>} Resultado de la operación
   */
  @Delete(":id")
  @Roles("admin")
  @ApiDelete(
    "Pedidos",
    "Eliminar orden",
    "Elimina permanentemente una orden del sistema",
  )
  @ApiParam({
    name: "id",
    description: "Identificador único de la orden a eliminar",
    required: true,
    type: String,
    example: "645a7594e21e1b4801d45432",
  })
  @ApiResponse({
    status: 200,
    description: "Orden eliminada correctamente",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645a7594e21e1b4801d45432" },
        message: { type: "string", example: "Orden eliminada correctamente" },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Orden no encontrada",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 404 },
        message: {
          type: "string",
          example: "Orden con ID 645a7594e21e1b4801d45432 no encontrada",
        },
        error: { type: "string", example: "Not Found" },
      },
    },
  })
  async delete(@Param("id") id: string) {
    return this.orderService.deleteOrder(id);
  }

  /**
   * Marca una orden como pagada.
   * @param {string} id - Identificador único de la orden
   * @returns {Promise<Order>} Orden actualizada con estado pagado
   */
  @Put(":id/pay")
  @Roles("admin", "user")
  @ApiOperation({
    summary: "Marcar orden como pagada",
    description:
      "Actualiza el estado de una orden a 'pagada' y registra la fecha de pago",
  })
  @ApiParam({
    name: "id",
    description: "Identificador único de la orden",
    required: true,
    type: String,
    example: "645a7594e21e1b4801d45432",
  })
  @ApiResponse({
    status: 200,
    description: "Orden marcada como pagada correctamente",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645a7594e21e1b4801d45432" },
        status: { type: "string", example: "processing" },
        paidAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-09T15:30:45.123Z",
        },
        message: {
          type: "string",
          example: "Orden marcada como pagada correctamente",
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Orden no encontrada",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 404 },
        message: {
          type: "string",
          example: "Orden con ID 645a7594e21e1b4801d45432 no encontrada",
        },
        error: { type: "string", example: "Not Found" },
      },
    },
  })
  async markAsPaid(@Param("id") id: string) {
    return this.orderService.markOrderAsPaid(id);
  }

  /**
   * Obtiene órdenes por usuario.
   * @param {string} userId - Identificador del usuario
   * @returns {Promise<Order[]>} Lista de órdenes del usuario
   */
  @Get("user/:userId")
  @Roles("admin", "user")
  @ApiOperation({
    summary: "Obtener órdenes por usuario",
    description: "Recupera todas las órdenes asociadas a un usuario específico",
  })
  @ApiParam({
    name: "userId",
    description: "Identificador único del usuario",
    required: true,
    type: String,
    example: "645a1234abcde1234567890",
  })
  @ApiResponse({
    status: 200,
    description: "Órdenes del usuario recuperadas correctamente",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", example: "645a7594e21e1b4801d45432" },
          userId: { type: "string", example: "645a1234abcde1234567890" },
          total: { type: "number", example: 249.99 },
          products: {
            type: "array",
            items: { type: "string" },
            example: ["645b8790a23d1b4801d12345", "645b8905c21e1b4801d67890"],
          },
          status: { type: "string", example: "pending" },
          paidAt: {
            type: "string",
            format: "date-time",
            example: "2023-05-09T15:30:45.123Z",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2023-05-09T14:25:08.987Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2023-05-09T15:30:45.123Z",
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: "Usuario no encontrado",
    schema: {
      type: "object",
      properties: {
        statusCode: { type: "number", example: 404 },
        message: {
          type: "string",
          example: "Usuario con ID 645a1234abcde1234567890 no encontrado",
        },
        error: { type: "string", example: "Not Found" },
      },
    },
  })
  async findByUserId(@Param("userId") userId: string) {
    return this.orderService.findByUserId(userId);
  }
}
