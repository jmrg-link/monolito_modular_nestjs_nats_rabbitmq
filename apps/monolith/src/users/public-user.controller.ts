import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { UserService } from "./application/User.service";
import { User } from "./domain/User.entity";
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiBody,
} from "@nestjs/swagger";

@ApiTags("Validación de Usuarios")
@Controller("public/users")
export class PublicUserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Verifica si un email ya está registrado
   * @param email - Email a verificar
   * @returns Objeto indicando si el email existe y mensaje descriptivo
   */
  @Get("check-email")
  @ApiOperation({
    summary: "Verificar disponibilidad de email",
    description: "Determina si un email ya está registrado en el sistema",
  })
  @ApiQuery({
    name: "email",
    description: "Dirección de email para verificar",
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Resultado de verificación",
    schema: {
      type: "object",
      properties: {
        exists: { type: "boolean", example: false },
        message: { type: "string", example: "El email está disponible" },
      },
    },
  })
  async checkEmail(@Query("email") email: string) {
    const user = await this.userService.findByEmail(email);
    const exists = !!user;
    return {
      exists,
      message: exists
        ? `El email ${email} ya está registrado`
        : `El email ${email} está disponible`,
    };
  }

  /**
   * Busca un usuario por su email para autenticación
   * @param email - Email del usuario
   * @returns Datos del usuario incluyendo passwordHash para autenticación
   * @throws NotFoundException - Si el usuario no existe
   */
  @Get("by-email")
  @ApiOperation({
    summary: "Buscar usuario por email",
    description:
      "Obtiene datos de un usuario mediante su email para autenticación",
  })
  @ApiQuery({
    name: "email",
    description: "Email del usuario a buscar",
    required: true,
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Usuario encontrado",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645a1234abcde1234567890" },
        email: { type: "string", example: "usuario@ejemplo.com" },
        name: { type: "string", example: "Juan Pérez" },
        passwordHash: { type: "string", example: "$2b$10$..." },
        roles: {
          type: "array",
          items: { type: "string" },
          example: ["user"],
        },
        isActive: { type: "boolean", example: true },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Usuario no encontrado" })
  async findByEmail(@Query("email") email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`Usuario con email ${email} no encontrado`);
    }

    // Obtener passwordHash directamente de la base de datos si no está disponible
    let passwordHash = (user as any).passwordHash;

    if (!passwordHash) {
      const mongoose = require("mongoose");
      const UserModel = mongoose.model("UserDocument");
      const userDoc = await UserModel.findOne({ email })
        .select("+passwordHash")
        .lean()
        .exec();
      if (userDoc) {
        passwordHash = userDoc.passwordHash;
      }
    }

    // Verificar que tenemos la contraseña para el proceso de autenticación
    if (!passwordHash) {
      this.userService.logger.warn(
        `Usuario encontrado pero sin passwordHash: ${email}`,
      );
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      passwordHash: passwordHash,
      roles: user.roles,
      isActive: user.isActive,
    };
  }

  /**
   * Obtiene un usuario por su ID
   * @param id - ID del usuario
   * @returns Datos completos del usuario
   * @throws NotFoundException - Si el usuario no existe
   */
  @Get(":id")
  @ApiOperation({
    summary: "Obtener usuario por ID",
    description:
      "Recupera un usuario mediante su ID para verificación de token",
  })
  @ApiResponse({
    status: 200,
    description: "Usuario encontrado",
    schema: {
      type: "object",
      properties: {
        id: { type: "string", example: "645a1234abcde1234567890" },
        email: { type: "string", example: "usuario@ejemplo.com" },
        name: { type: "string", example: "Juan Pérez" },
        passwordHash: { type: "string", example: "$2b$10$..." },
        roles: {
          type: "array",
          items: { type: "string" },
          example: ["user"],
        },
        isActive: { type: "boolean", example: true },
      },
    },
  })
  @ApiResponse({ status: 404, description: "Usuario no encontrado" })
  async findById(@Param("id") id: string) {
    try {
      const user = await this.userService.findById(id);
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        passwordHash: (user as any).passwordHash,
        roles: user.roles,
        isActive: user.isActive,
      };
    } catch (error) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }

  /**
   * Registra un nuevo usuario en el sistema
   * @param body - Datos para el registro del usuario
   * @returns Usuario creado con ID real generado por MongoDB
   */
  @Post("register")
  @ApiOperation({
    summary: "Registrar nuevo usuario",
    description:
      "Crea un nuevo usuario en el sistema y devuelve su ID generado por MongoDB",
  })
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
        createdAt: {
          type: "string",
          format: "date-time",
          example: "2023-05-13T09:12:34.567Z",
        },
      },
    },
  })
  async register(
    @Body()
    body: {
      email: string;
      name: string;
      password: string;
      roles?: string[];
    },
  ) {
    const existingUser = await this.userService.findByEmail(body.email);
    if (existingUser) {
      return {
        error: true,
        message: `El email ${body.email} ya está registrado`,
        statusCode: 400,
      };
    }

    const user = new User(
      undefined as unknown as string,
      body.email,
      body.name,
      Array.isArray(body.roles) ? body.roles : ["user"],
    );

    const created = await this.userService.createUser(user, body.password);

    return {
      id: created.id,
      email: created.email,
      name: created.name,
      roles: created.roles,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Cambia la contraseña de un usuario sin requerir autenticación adicional
   * @param id - ID del usuario
   * @param body - Contraseña actual y nueva
   * @returns Mensaje de confirmación
   */
  @Post(":id/change-password")
  @ApiOperation({
    summary: "Cambiar contraseña",
    description:
      "Actualiza la contraseña de un usuario verificando la contraseña actual",
  })
  @ApiResponse({
    status: 200,
    description: "Contraseña actualizada correctamente",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "Contraseña actualizada correctamente",
        },
      },
    },
  })
  async changePassword(
    @Param("id") id: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    try {
      const user = await this.userService.findById(id);

      const isPasswordValid = await bcrypt.compare(
        body.currentPassword,
        (user as any).passwordHash,
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException("La contraseña actual es incorrecta");
      }

      const passwordHash = await bcrypt.hash(body.newPassword, 10);
      await this.userService.updatePassword(id, passwordHash);

      return { message: "Contraseña actualizada correctamente" };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }
}
