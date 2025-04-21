/**
 * @fileoverview Controlador público de usuarios para operaciones sin autenticación
 * @module Users/Controllers
 * @description Implementa endpoints públicos para registro, verificación de email y cambios de contraseña.
 * Utiliza DTOs para validación de entrada y mantiene principios SOLID.
 */
import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  NotFoundException,
  UnauthorizedException,
  Logger,
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
import { CreateUserDto } from "./application/CreateUser.dto";
import { IUserEntity } from "./domain";

/**
 * @class PublicUserController
 * @public
 * @description Controlador para endpoints públicos de usuarios sin requerir autenticación
 */
@ApiTags("Validación de Usuarios")
@Controller("public/users")
export class PublicUserController {
  private readonly logger = new Logger(PublicUserController.name);

  /**
   * @constructor
   * @param {UserService} userService - Servicio de usuarios para lógica de negocio
   */
  constructor(private readonly userService: UserService) {}

  /**
   * Verifica si un email ya está registrado
   * @public
   * @param {string} email - Email a verificar
   * @returns {Promise<object>} Objeto indicando si el email existe y mensaje descriptivo
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
   * @public
   * @param {string} email - Email del usuario
   * @returns {Promise<object>} Datos del usuario incluyendo passwordHash para autenticación
   * @description Busca un usuario por su email para autenticación y devuelve sus datos si existe en la base de datos.
   * @throws {NotFoundException} Si el usuario no existe
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

    let passwordHash = (user as IUserEntity).passwordHash;
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

    if (!passwordHash) {
      this.logger.warn(`Usuario encontrado pero sin passwordHash: ${email}`);
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
   * @public
   * @param {string} id - ID del usuario
   * @returns {Promise<object>} Datos completos del usuario
   * @throws {NotFoundException} Si el usuario no existe
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
        passwordHash: (user as IUserEntity).passwordHash,
        roles: user.roles,
        isActive: user.isActive,
      };
    } catch (error) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
  }

  /**
   * @public
   * @decorador @POST
   * @param {CreateUserDto} createUserDto - Datos para el registro del usuario
   * @returns {Promise<object>} Usuario creado con ID real generado por MongoDB
   * @description Registra un nuevo usuario en el sistema y devuelve su ID generado junto
   * al objeto del modelo de mongodb generado correctamente
   */
  @Post("register")
  @ApiOperation({
    summary: "Registrar nuevo usuario",
    description:
      "Crea un nuevo usuario en el sistema y devuelve su ID generado por MongoDB",
  })
  @ApiBody({ type: CreateUserDto })
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
  async register(@Body() createUserDto: CreateUserDto) {
    const existingUser = await this.userService.findByEmail(
      createUserDto.email,
    );
    if (!existingUser) {
      this.logger.log(
        `El email ${createUserDto.email} no está registrado`,
      );
    }
    this.logger.log({
      message: `Verificando email ${createUserDto.email}`,
      exists: !!existingUser,
    })

    if (existingUser) {
      return {
        error: true,
        message: `El email ${createUserDto.email} ya está registrado`,
        statusCode: 400,
      };
    }

    this.logger.log(
      `Creando usuario ${createUserDto.name} ${createUserDto.lastName} con email ${createUserDto.email}`,
    );

    const user = new User(
      undefined,
      createUserDto.password,
      createUserDto.email,
      createUserDto.name,
      createUserDto.lastName
    )

    const created = await this.userService.createUser(
      user,
      createUserDto.password,
      undefined
    );

    this.logger.log(`Usuario registrado: ${created.email}`);

    return {
      code: 201,
      id: created.id,
      email: created.email,
      name: created.name,
      firstName: created.firstName,
      roles: created.roles,
      createdAt: new Date().toISOString(),
      message: `Usuario ${created.name} ${created.firstName} registrado exitosamente`,
    };
  }

  /**
   * @public
   * @decorador @POST
   * @param {string} id - ID del usuario
   * @param {object} body - Contraseña actual y nueva
   * @param {string} body.currentPassword - Contraseña actual del usuario
   * @param {string} body.newPassword - Nueva contraseña del usuario
   * @returns {Promise<object>} Mensaje de confirmación
   * @description Cambia la contraseña de un usuario sin requerir autenticación adicional
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
        (user as IUserEntity).passwordHash || "",
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
