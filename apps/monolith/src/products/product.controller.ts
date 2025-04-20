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
import { ProductService } from "./application/Product.service";
import { Product } from "./domain/Product.entity";
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
  ApiPublic,
} from "@libs/common/src/decorators";

/**
 * Controlador de productos
 */
@ApiTags("Productos")
@Controller("products")
export class ProductController {
  /**
   * Constructor del controlador de productos
   * @param productService Servicio de productos
   */
  constructor(private readonly productService: ProductService) {}

  /**
   * Obtiene todos los productos con opciones de paginación
   * @param page Número de página
   * @param limit Elementos por página
   * @param sortBy Campo para ordenar
   * @param order Dirección del ordenamiento
   * @returns Lista paginada de productos
   */
  @Get()
  @ApiPublic(
    "Productos",
    "Listar todos los productos",
    "Recupera el catálogo de productos con soporte para paginación y ordenamiento",
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
    example: "price",
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
    description: "Listado de productos recuperado correctamente",
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", example: "645b8790a23d1b4801d12345" },
              name: { type: "string", example: "Smartphone Galaxy S23" },
              price: { type: "number", example: 899.99 },
              isActive: { type: "boolean", example: true },
              description: {
                type: "string",
                example:
                  "Smartphone premium con cámara de 108MP y pantalla AMOLED",
              },
              createdAt: {
                type: "string",
                format: "date-time",
                example: "2023-05-10T10:15:28.456Z",
              },
              updatedAt: {
                type: "string",
                format: "date-time",
                example: "2023-05-10T10:15:28.456Z",
              },
            },
          },
        },
        meta: {
          type: "object",
          properties: {
            totalItems: { type: "number", example: 150 },
            itemCount: { type: "number", example: 10 },
            itemsPerPage: { type: "number", example: 10 },
            totalPages: { type: "number", example: 15 },
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
    return this.productService.findAll(options);
  }

  /**
   * Obtiene un producto por su ID
   * @param id Identificador único del producto
   * @returns Producto encontrado
   */
  @Get(":id")
  @ApiGetById(
    "Productos",
    "Obtener producto por ID",
    "Recupera un producto específico mediante su identificador único",
  )
  @ApiResponse({
    status: 200,
    description: "Producto encontrado",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645b8790a23d1b4801d12345" },
        name: { type: "string", example: "Smartphone Galaxy S23" },
        price: { type: "number", example: 899.99 },
        isActive: { type: "boolean", example: true },
        description: {
          type: "string",
          example: "Smartphone premium con cámara de 108MP y pantalla AMOLED",
        },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-10T10:15:28.456Z",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-10T10:15:28.456Z",
        },
      },
    },
  })
  async findById(@Param("id") id: string) {
    return this.productService.findById(id);
  }

  /**
   * Crea un nuevo producto
   * @param body Datos del producto
   * @returns Producto creado
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth("access-token")
  @ApiCreate(
    "Productos",
    "Crear nuevo producto",
    "Añade un nuevo producto al catálogo",
  )
  @ApiBody({
    schema: {
      type: "object",
      required: ["name", "price"],
      properties: {
        name: { type: "string", example: 'Monitor UltraWide 34"' },
        price: { type: "number", example: 349.99 },
        description: {
          type: "string",
          example:
            "Monitor ultrawide de 34 pulgadas con resolución 3440x1440 y panel IPS",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Producto creado exitosamente",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645c1234f67d1b4801d89012" },
        name: { type: "string", example: 'Monitor UltraWide 34"' },
        price: { type: "number", example: 349.99 },
        isActive: { type: "boolean", example: true },
        description: {
          type: "string",
          example:
            "Monitor ultrawide de 34 pulgadas con resolución 3440x1440 y panel IPS",
        },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-11T09:45:12.789Z",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-11T09:45:12.789Z",
        },
      },
    },
  })
  async create(
    @Body() body: { name: string; price: number; description?: string },
  ) {
    const product = new Product(Date.now().toString(), body.name, body.price);
    return this.productService.createProduct(product, body.description);
  }

  /**
   * Actualiza un producto existente
   * @param id Identificador único del producto
   * @param body Datos a actualizar
   * @returns Producto actualizado
   */
  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Actualizar producto",
    description: "Modifica los datos de un producto existente",
  })
  @ApiParam({
    name: "id",
    description: "Identificador único del producto",
    required: true,
    type: String,
    example: "645b8790a23d1b4801d12345",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        name: { type: "string", example: "Smartphone Galaxy S23 Ultra" },
        price: { type: "number", example: 1199.99 },
        isActive: { type: "boolean", example: true },
        description: {
          type: "string",
          example: "Versión premium con S-Pen incluido, 512GB y 12GB RAM",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Producto actualizado correctamente",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645b8790a23d1b4801d12345" },
        name: { type: "string", example: "Smartphone Galaxy S23 Ultra" },
        price: { type: "number", example: 1199.99 },
        isActive: { type: "boolean", example: true },
        description: {
          type: "string",
          example: "Versión premium con S-Pen incluido, 512GB y 12GB RAM",
        },
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-10T10:15:28.456Z",
        },
        updatedAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-11T14:22:33.123Z",
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Producto no encontrado" })
  async update(
    @Param("id") id: string,
    @Body()
    body: Partial<{
      name: string;
      price: number;
      isActive: boolean;
      description: string;
    }>,
  ) {
    return this.productService.updateProduct(id, body);
  }

  /**
   * Elimina un producto
   * @param id Identificador único del producto
   * @returns Resultado de la operación
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiBearerAuth("access-token")
  @ApiDelete(
    "Productos",
    "Eliminar producto",
    "Elimina permanentemente un producto del catálogo",
  )
  async delete(@Param("id") id: string) {
    return this.productService.deleteProduct(id);
  }

  /**
   * Busca productos por nombre
   * @param term Término de búsqueda
   * @returns Lista de productos que coinciden
   */
  @Get("search/name")
  @ApiOperation({
    summary: "Buscar productos por nombre",
    description:
      "Realiza una búsqueda de productos que contengan el término especificado en su nombre",
  })
  @ApiQuery({
    name: "term",
    description: "Término de búsqueda",
    required: true,
    type: String,
    example: "smartphone",
  })
  @ApiResponse({
    status: 200,
    description: "Resultados de la búsqueda",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", example: "645b8790a23d1b4801d12345" },
          name: { type: "string", example: "Smartphone Galaxy S23" },
          price: { type: "number", example: 899.99 },
          isActive: { type: "boolean", example: true },
          description: {
            type: "string",
            example: "Smartphone premium con cámara de 108MP y pantalla AMOLED",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            example: "2023-05-10T10:15:28.456Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            example: "2023-05-10T10:15:28.456Z",
          },
        },
      },
    },
  })
  async searchByName(@Query("term") term: string) {
    return this.productService.searchByName(term);
  }

  /**
   * Obtiene productos por rango de precio
   * @param min Precio mínimo
   * @param max Precio máximo
   * @returns Lista de productos en el rango
   */
  @Get("price/range")
  @ApiOperation({
    summary: "Filtrar productos por rango de precio",
    description:
      "Obtiene productos cuyo precio está dentro del rango especificado",
  })
  @ApiQuery({
    name: "min",
    description: "Precio mínimo",
    required: true,
    type: Number,
    example: 500,
  })
  @ApiQuery({
    name: "max",
    description: "Precio máximo",
    required: true,
    type: Number,
    example: 1000,
  })
  @ApiResponse({
    status: 200,
    description: "Productos filtrados por rango de precio",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", example: "645b8790a23d1b4801d12345" },
          name: { type: "string", example: "Smartphone Galaxy S23" },
          price: { type: "number", example: 899.99 },
          isActive: { type: "boolean", example: true },
          description: {
            type: "string",
            example: "Smartphone premium con cámara de 108MP y pantalla AMOLED",
          },
        },
      },
    },
  })
  async findByPriceRange(
    @Query("min", ParseIntPipe) min: number,
    @Query("max", ParseIntPipe) max: number,
  ) {
    return this.productService.findByPriceRange(min, max);
  }
}
