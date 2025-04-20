import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiResponse, ApiBearerAuth, ApiBody } from "@nestjs/swagger";
import { AuthService } from "./Auth.service";
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  RefreshTokenDto,
} from "./Auth.dto";
import { JwtAuthGuard } from "@libs/common/src/auth/auth.guard";
import { UserAuth } from "@libs/common/src/interfaces/auth.interface";
import {
  ApiLogin,
  ApiRegister,
  ApiRefreshToken,
  ApiProfile,
  ApiChangePassword,
} from "@libs/common";

/**
 * Controlador para la gestión de autenticación y operaciones de identidad.
 * Maneja flujos de inicio de sesión, registro, renovación de tokens y gestión de perfil.
 */
@ApiTags("Autenticación")
@Controller("auth")
export class AuthController {
  /**
   * Constructor del controlador de autenticación.
   * @param {AuthService} authService - Servicio de autenticación
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * Autentica a un usuario y emite tokens JWT.
   * @param {LoginDto} loginDto - Credenciales de usuario
   * @returns {Promise<AuthResponse>} Respuesta de autenticación con tokens y datos de usuario
   */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiLogin()
  @ApiBody({
    type: LoginDto,
    required: true,
  })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * Registra un nuevo usuario en el sistema.
   * @param {RegisterDto} registerDto - Datos para crear el nuevo usuario
   * @returns {Promise<AuthResponse>} Respuesta de autenticación con tokens y datos del usuario creado
   */
  @Post("register")
  @ApiRegister()
  @ApiBody({
    type: RegisterDto,
    required: true,
  })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * Renueva el token de acceso usando un token de refresco válido.
   * @param {RefreshTokenDto} refreshTokenDto - Token de refresco
   * @returns {Promise<{accessToken: string}>} Nuevo token de acceso
   */
  @Post("refresh-token")
  @HttpCode(HttpStatus.OK)
  @ApiRefreshToken()
  @ApiBody({
    type: RefreshTokenDto,
    required: true,
  })
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  /**
   * Obtiene el perfil del usuario autenticado.
   * @param {Request} req - Objeto de solicitud con datos del usuario autenticado
   * @returns {UserAuth} Información del perfil de usuario
   */
  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiProfile()
  getProfile(@Request() req: { user: UserAuth }) {
    return req.user;
  }

  /**
   * Actualiza la contraseña del usuario autenticado.
   * @param {Request} req - Objeto de solicitud con datos del usuario autenticado
   * @param {ChangePasswordDto} changePasswordDto - Contraseña actual y nueva
   * @returns {Promise<{message: string}>} Confirmación de actualización exitosa
   */
  @Post("change-password")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiChangePassword()
  @ApiBody({
    type: ChangePasswordDto,
    required: true,
  })
  changePassword(
    @Request() req: { user: UserAuth },
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(req.user.id, changePasswordDto);
  }
}
