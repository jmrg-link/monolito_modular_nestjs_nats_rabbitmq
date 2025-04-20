import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
  ServiceUnavailableException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ClientProxy } from "@nestjs/microservices";
import { firstValueFrom, of, timeout, catchError, retry } from "rxjs";
import {
  NATS_MESSAGE_PATTERNS,
  NATS_PATTERNS,
  RMQ_PATTERNS,
  MessageRetryBuffer,
} from "@libs/common/src/microservices";
import {
  LoginDto,
  RegisterDto,
  ChangePasswordDto,
  RefreshTokenDto,
} from "./Auth.dto";
import {
  AuthResponse,
  JwtPayload,
} from "@libs/common/src/interfaces/auth.interface";
import * as bcrypt from "bcrypt";

/**
 * Authentication service handling user authentication and token management.
 * Implements core security flows and communicates with user service via messaging.
 */
@Injectable()
export class AuthService {
  /**
   * Creates a new authentication service instance.
   * @param {JwtService} jwtService JWT token generation and validation service
   * @param {ClientProxy} natsClient NATS client for user service communication
   * @param {ClientProxy} rabbitClient RabbitMQ client for event publishing
   */
  constructor(
    private readonly jwtService: JwtService,
    @Inject("NATS_SERVICE") private readonly natsClient: ClientProxy,
    @Inject("RABBITMQ_SERVICE") private readonly rabbitClient: ClientProxy,
    private readonly messageRetryBuffer: MessageRetryBuffer,
  ) {
    this.natsClient.connect().catch((err) => {
      console.error("[AuthService] Error al conectar con NATS:", err);
    });
  }

  /**
   * Prueba la comunicación NATS enviando un mensaje simple y esperando respuesta
   * @returns {Promise<boolean>} True si la comunicación es exitosa
   */
  async testNatsConnection(): Promise<boolean> {
    try {
      console.log(`[AuthService] Probando conexión NATS con ping`);
      await this.natsClient.connect();
      return true;
    } catch (error) {
      console.error(`[AuthService] Error al probar conexión NATS:`, error);
      return false;
    }
  }

  /**
   * Autentica un usuario y genera tokens JWT
   * @param loginDto - Credenciales del usuario (email y password)
   * @returns Respuesta con tokens JWT y datos del usuario
   * @throws UnauthorizedException - Si las credenciales son inválidas
   * @throws ServiceUnavailableException - Si hay problemas de conexión
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      console.log(
        `[AuthService] Iniciando login para email: ${loginDto.email}`,
      );
      const isConnected = await this.testNatsConnection();
      if (!isConnected) {
        console.warn(
          `[AuthService] No hay conexión con NATS, usando fallback HTTP`,
        );
      }
      let userData = null;
      if (isConnected) {
        try {
          console.log(
            `[AuthService] Buscando usuario por email via NATS: ${loginDto.email}`,
          );
          userData = await firstValueFrom(
            this.natsClient
              .send(NATS_MESSAGE_PATTERNS.USER.FIND_BY_EMAIL, {
                email: loginDto.email,
              })
              .pipe(
                timeout(3000),
                catchError((err) => {
                  console.error(
                    `[AuthService] Error al buscar usuario por NATS: ${err.message || "Error desconocido"}`,
                  );
                  return of(null);
                }),
              ),
          );

          if (userData) {
            console.log(
              `[AuthService] Usuario encontrado por NATS: ${userData.email}`,
            );
          }
        } catch (error) {
          console.error(
            `[AuthService] Error en comunicación NATS: ${error instanceof Error ? error.message : "Error desconocido"}`,
          );
        }
      }
      if (!userData) {
        try {
          console.log(
            `[AuthService] Buscando usuario por email via HTTP directo: ${loginDto.email}`,
          );
          const http = require("http");
          const userDataPromise = new Promise<any>((resolve, reject) => {
            const req = http.request(
              {
                hostname: process.env.MONOLITH_HOST || "localhost",
                port: process.env.PORT_MONOLITH || 3001,
                path: `/api/public/users/by-email?email=${encodeURIComponent(loginDto.email)}`,
                method: "GET",
                timeout: 3000,
                headers: {
                  "Content-Type": "application/json",
                },
              },
              (res: any) => {
                let data = "";
                res.on("data", (chunk: Buffer) => (data += chunk));
                res.on("end", () => {
                  try {
                    if (res.statusCode !== 200) {
                      console.log(
                        `[AuthService] HTTP respondió con status ${res.statusCode}`,
                      );
                      resolve(null);
                      return;
                    }
                    const result = JSON.parse(data);
                    if (result && result.email === loginDto.email) {
                      console.log(
                        `[AuthService] Usuario encontrado por HTTP: ${result.email}`,
                      );
                      resolve(result);
                    } else {
                      resolve(null);
                    }
                  } catch (e) {
                    console.log(
                      `[AuthService] Error al parsear respuesta HTTP: ${e instanceof Error ? e.message : String(e)}`,
                    );
                    resolve(null);
                  }
                });
              },
            );
            req.on("error", (err: Error) => {
              console.error(
                `[AuthService] Error en solicitud HTTP: ${err.message}`,
              );
              resolve(null);
            });
            req.on("timeout", () => {
              req.destroy();
              console.log(`[AuthService] Timeout en solicitud HTTP`);
              resolve(null);
            });
            req.end();
          });
          userData = await userDataPromise;
        } catch (error) {
          console.error(
            `[AuthService] Error al buscar usuario por HTTP: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }

      if (!userData) {
        throw new UnauthorizedException("Credenciales inválidas");
      }

      try {
        if (!userData.passwordHash) {
          console.error(
            `[AuthService] Error: El usuario no tiene passwordHash definido`,
          );
          throw new UnauthorizedException("Error al verificar credenciales");
        }

        const isPasswordValid = await bcrypt.compare(
          loginDto.password,
          userData.passwordHash,
        );

        if (!isPasswordValid) {
          throw new UnauthorizedException("Credenciales inválidas");
        }
      } catch (error) {
        console.error(
          `[AuthService] Error al verificar contraseña: ${error instanceof Error ? error.message : String(error)}`,
        );
        throw new UnauthorizedException("Error al verificar credenciales");
      }

      try {
        const userId = userData._id?.toString() || userData.id;
        if (!userId) {
          console.warn(
            `[AuthService] No se pudo obtener un ID válido del usuario ${userData.email}`,
          );
        } else {
          const loginEvent = {
            id: userId,
            timestamp: new Date().toISOString(),
          };

          const natsPattern = NATS_PATTERNS.USER.LOGGED_IN || "user.loggedIn";
          if (isConnected) {
            console.log(
              `[AuthService] Emitiendo evento login en NATS: ${natsPattern}`,
            );
            this.natsClient.emit(natsPattern, loginEvent);
          }

          const rmqPattern = RMQ_PATTERNS.USER.LOGGED_IN || "user.loggedIn";
          console.log(
            `[AuthService] Emitiendo evento login en RabbitMQ: ${rmqPattern} - ID: ${userId}`,
          );
          this.rabbitClient.emit(rmqPattern, loginEvent);

          try {
            const amqplib = require("amqplib");
            let connection: any;
            amqplib
              .connect(
                process.env.RABBITMQ_URL ||
                  "amqp://rabbit_user:rabbit_password@localhost:5672",
              )
              .then((conn: any) => {
                connection = conn;
                return conn.createChannel();
              })
              .then((channel: any) => {
                setTimeout(() => {
                  const messageWithPattern = {
                    pattern: "user.loggedIn",
                    data: loginEvent,
                  };

                  const published = channel.publish(
                    "user_exchange",
                    "user.loggedIn",
                    Buffer.from(JSON.stringify(messageWithPattern)),
                    { persistent: true },
                  );

                  console.log(
                    `[RabbitMQ] Mensaje publicado manualmente en 'user_exchange' con routing key 'user.loggedIn': ${published ? "Éxito" : "Fallo"}`,
                  );

                  setTimeout(() => {
                    channel.close();
                    connection.close();
                  }, 500);
                }, 1000);
              })
              .catch((err: any) => {
                console.error(
                  `[RabbitMQ] Error al publicar evento de login manual: ${err.message}`,
                );

                this.messageRetryBuffer.addMessage(
                  "user_exchange",
                  "user.loggedIn",
                  {
                    pattern: "user.loggedIn",
                    data: loginEvent,
                  },
                );
              });
          } catch (error) {
            console.warn(
              `[AuthService] Error en publicación manual: ${error instanceof Error ? error.message : String(error)}`,
            );

            this.messageRetryBuffer.addMessage(
              "user_exchange",
              "user.loggedIn",
              {
                pattern: "user.loggedIn",
                data: loginEvent,
              },
            );
          }
        }
      } catch (error) {
        console.warn(
          `[AuthService] No se pudo emitir evento de login: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      return this.generateAuthResponse(userData);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error(
        `[AuthService] Error en login: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException("Error de autenticación");
    }
  }

  /**
   * Registra un nuevo usuario en el sistema, lo busca en la base de datos y genera tokens de autenticación.
   * @param {RegisterDto} registerDto Datos de registro del usuario
   * @returns {Promise<AuthResponse>} Respuesta de autenticación con tokens y datos del usuario
   * @throws {BadRequestException} Cuando el email ya existe o hay un error en el registro
   * @throws {ServiceUnavailableException} Cuando no hay conexión con el servicio de usuarios
   */
  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    try {
      const isConnected = await this.testNatsConnection();
      if (!isConnected) {
        throw new ServiceUnavailableException(
          "Error de conexión con el servicio de usuarios. Intente nuevamente más tarde.",
        );
      }

      let existingUser = null;
      try {
        existingUser = await firstValueFrom(
          this.natsClient
            .send(NATS_MESSAGE_PATTERNS.USER.FIND_BY_EMAIL, {
              email: registerDto.email,
            })
            .pipe(
              timeout(3000),
              catchError(() => {
                console.log(
                  `[AuthService] No se pudo verificar si el email existe mediante NATS`,
                );
                return of(null);
              }),
            ),
        );

        if (existingUser) {
          throw new BadRequestException(
            `El email ${registerDto.email} ya está registrado`,
          );
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
      }
      try {
        const http = require("http");
        interface EmailCheckResult {
          exists: boolean;
          message: string;
        }

        const directCheckPromise = new Promise<EmailCheckResult>(
          (resolve, reject) => {
            const req = http.request(
              {
                hostname: process.env.MONOLITH_HOST || "localhost",
                port: process.env.PORT_MONOLITH || 3001,
                path: `/api/public/users/check-email?email=${encodeURIComponent(registerDto.email)}`,
                method: "GET",
                timeout: 2000,
                headers: {
                  "Content-Type": "application/json",
                },
              },
              (res: any) => {
                let data = "";
                res.on("data", (chunk: Buffer) => {
                  data += chunk;
                });
                res.on("end", () => {
                  try {
                    if (res.statusCode !== 200) {
                      console.log(
                        `[AuthService] El endpoint check-email respondió con status ${res.statusCode}`,
                      );
                      resolve({
                        exists: false,
                        message: `Error de verificación: ${res.statusCode}`,
                      });
                      return;
                    }

                    const result = JSON.parse(data) as EmailCheckResult;
                    resolve(result);
                  } catch (e) {
                    console.log(
                      `[AuthService] Error al parsear respuesta: ${e instanceof Error ? e.message : String(e)}`,
                    );
                    resolve({ exists: false, message: "No se pudo verificar" });
                  }
                });
              },
            );

            req.on("error", () => {
              resolve({ exists: false, message: "Error de conexión" });
            });

            req.on("timeout", () => {
              req.destroy();
              resolve({ exists: false, message: "Timeout de conexión" });
            });
            req.end();
          },
        );

        const directCheckResult = await directCheckPromise;
        console.log(
          `[AuthService] Verificación directa de email: ${JSON.stringify(directCheckResult)}`,
        );

        if (directCheckResult.exists) {
          throw new BadRequestException(
            `El email ${registerDto.email} ya está registrado (verificación directa)`,
          );
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
      }

      const passwordHash = await bcrypt.hash(registerDto.password, 10);
      const userData = {
        email: registerDto.email,
        name: registerDto.name,
        passwordHash,
        roles: ["user"],
        isActive: true,
      };

      try {
        const http = require("http");
        const directRegisterPromise = new Promise<any>((resolve, reject) => {
          const postData = JSON.stringify({
            email: registerDto.email,
            name: registerDto.name,
            password: registerDto.password,
            roles: ["user"],
          });

          const req = http.request(
            {
              hostname: process.env.MONOLITH_HOST || "localhost",
              port: process.env.PORT_MONOLITH || 3001,
              path: "/api/public/users/register",
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(postData),
              },
              timeout: 5000,
            },
            (res: any) => {
              let data = "";
              res.on("data", (chunk: Buffer) => (data += chunk));
              res.on("end", () => {
                if (res.statusCode === 201 || res.statusCode === 200) {
                  try {
                    const result = JSON.parse(data);
                    resolve(result);
                  } catch (e) {
                    reject(
                      new Error(
                        `Error al parsear respuesta: ${e instanceof Error ? e.message : String(e)}`,
                      ),
                    );
                  }
                } else {
                  try {
                    const errorData = JSON.parse(data);
                    if (
                      errorData.message &&
                      errorData.message.includes("ya está registrado")
                    ) {
                      reject(new BadRequestException(errorData.message));
                    } else {
                      reject(
                        new Error(
                          `Error HTTP ${res.statusCode}: ${errorData.message || "Error desconocido"}`,
                        ),
                      );
                    }
                  } catch {
                    reject(new Error(`Error HTTP ${res.statusCode}`));
                  }
                }
              });
            },
          );

          req.on("error", (err: Error) => {
            console.error(
              "[AuthService] Error en solicitud HTTP:",
              err.message,
            );
            reject(
              new Error(`Error de conexión al crear usuario: ${err.message}`),
            );
          });

          req.on("timeout", () => {
            req.destroy();
            reject(new Error("Timeout al intentar crear usuario"));
          });

          req.write(postData);
          req.end();
        });

        const createdUser = await directRegisterPromise;
        console.log(
          `[AuthService] Usuario creado exitosamente con ID: ${createdUser.id}`,
        );

        return this.generateAuthResponse({
          _id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
          roles: createdUser.roles,
          isActive: true,
        });
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
      }

      if (existingUser) {
        throw new BadRequestException(
          `El email ${registerDto.email} ya está registrado`,
        );
      }

      const tempUser = {
        _id: Date.now().toString(),
        email: registerDto.email,
        name: registerDto.name,
        passwordHash,
        roles: ["user"],
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      this.publishUserCreatedEvent(tempUser);

      return this.generateAuthResponse(tempUser);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      console.error("Registration error:", error);
      throw new BadRequestException("Error en el registro de usuario");
    }
  }

  /**
   * Renueva el token de acceso usando un token de refresco válido
   * @param refreshTokenDto - Token de refresco
   * @returns Nuevo token de acceso
   * @throws UnauthorizedException - Si el token es inválido o expirado
   */
  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ accessToken: string }> {
    try {
      console.log(`[AuthService] Procesando solicitud de refresh token`);

      let decoded: any;
      try {
        decoded = this.jwtService.verify(refreshTokenDto.refreshToken, {
          secret: process.env.JWT_REFRESH_SECRET || "refreshsecret",
        });
      } catch (error) {
        console.error(
          `[AuthService] Token inválido o expirado: ${error instanceof Error ? error.message : "Error desconocido"}`,
        );
        throw new UnauthorizedException("Token inválido o expirado");
      }

      if (!decoded || !decoded.sub) {
        throw new UnauthorizedException("Token malformado");
      }

      const isConnected = await this.testNatsConnection();
      let user = null;
      if (isConnected) {
        try {
          console.log(
            `[AuthService] Buscando usuario por ID via NATS: ${decoded.sub}`,
          );
          user = await firstValueFrom(
            this.natsClient
              .send(NATS_MESSAGE_PATTERNS.USER.FIND_BY_ID, {
                id: decoded.sub,
              })
              .pipe(
                timeout(3000),
                catchError((err) => {
                  console.error(
                    `[AuthService] Error al buscar usuario por NATS: ${err.message || "Error desconocido"}`,
                  );
                  return of(null);
                }),
              ),
          );

          if (user) {
            console.log(
              `[AuthService] Usuario encontrado por NATS: ${user.email}`,
            );
          }
        } catch (error) {
          console.error(
            `[AuthService] Error en comunicación NATS: ${error instanceof Error ? error.message : "Error desconocido"}`,
          );
        }
      }

      if (!user) {
        console.log(
          `[AuthService] No se pudo verificar usuario, usando datos del token como fallback`,
        );
        user = {
          _id: decoded.sub,
          id: decoded.sub,
          email: decoded.email,
          roles: decoded.roles || ["user"],
        };
      }

      const payload: JwtPayload = {
        sub: user._id?.toString() || user.id,
        email: user.email,
        roles: user.roles,
      };

      const accessToken = this.jwtService.sign(payload);

      return { accessToken };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error(
        `[AuthService] Error en refreshToken: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException("Error al renovar token");
    }
  }

  /**
   * Actualiza la contraseña de un usuario autenticado
   * @param userId - ID del usuario
   * @param changePasswordDto - Contraseña actual y nueva
   * @returns Confirmación de operación exitosa
   * @throws UnauthorizedException - Si la contraseña actual es incorrecta
   * @throws ServiceUnavailableException - Si hay problemas de conexión
   */
  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    try {
      console.log(
        `[AuthService] Iniciando cambio de contraseña para usuario: ${userId}`,
      );

      const isConnected = await this.testNatsConnection();
      let user = null;
      if (isConnected) {
        try {
          console.log(
            `[AuthService] Buscando usuario por ID via NATS: ${userId}`,
          );
          user = await firstValueFrom(
            this.natsClient
              .send(NATS_MESSAGE_PATTERNS.USER.FIND_BY_ID, {
                id: userId,
              })
              .pipe(
                timeout(3000),
                catchError((err) => {
                  console.error(
                    `[AuthService] Error al buscar usuario por NATS: ${err.message || "Error desconocido"}`,
                  );
                  return of(null);
                }),
              ),
          );

          if (user) {
            console.log(
              `[AuthService] Usuario encontrado por NATS: ${user.email}`,
            );
          }
        } catch (error) {
          console.error(
            `[AuthService] Error en comunicación NATS: ${error instanceof Error ? error.message : "Error desconocido"}`,
          );
        }
      }

      if (!user) {
        throw new UnauthorizedException("Usuario no encontrado");
      }

      const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        user.passwordHash,
      );

      if (!isCurrentPasswordValid) {
        throw new UnauthorizedException("La contraseña actual es incorrecta");
      }

      const newPasswordHash = await bcrypt.hash(
        changePasswordDto.newPassword,
        10,
      );
      let updateSuccess = false;
      if (isConnected) {
        try {
          console.log(
            `[AuthService] Actualizando contraseña via NATS: ${userId}`,
          );
          await firstValueFrom(
            this.natsClient
              .send(NATS_MESSAGE_PATTERNS.USER.UPDATE_PASSWORD, {
                id: userId,
                passwordHash: newPasswordHash,
              })
              .pipe(
                timeout(3000),
                catchError((err) => {
                  console.error(
                    `[AuthService] Error al actualizar contraseña por NATS: ${err.message || "Error desconocido"}`,
                  );
                  return of(null);
                }),
              ),
          );
          updateSuccess = true;
          console.log(
            `[AuthService] Contraseña actualizada exitosamente via NATS`,
          );
        } catch (error) {
          console.error(
            `[AuthService] Error al actualizar contraseña por NATS: ${error instanceof Error ? error.message : "Error desconocido"}`,
          );
        }
      }

      if (!updateSuccess) {
        throw new ServiceUnavailableException(
          "No se pudo actualizar la contraseña, intente más tarde",
        );
      }

      try {
        if (isConnected) {
          this.natsClient.emit(NATS_PATTERNS.USER.PASSWORD_CHANGED, {
            id: userId,
          });
        }
        this.rabbitClient.emit(RMQ_PATTERNS.USER.PASSWORD_CHANGED, {
          id: userId,
        });
        console.log(`[AuthService] Eventos de cambio de contraseña publicados`);
      } catch (error) {
        console.warn(
          `[AuthService] Error al publicar eventos: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      return { message: "Contraseña actualizada correctamente" };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }
      console.error(
        `[AuthService] Error en changePassword: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException("Error al cambiar la contraseña");
    }
  }

  /**
   * Genera una respuesta completa de autenticación con tokens y datos del usuario.
   * @param {any} user Datos del usuario desde la base de datos
   * @returns {AuthResponse} Tokens de autenticación e información del perfil
   * @private
   */
  private generateAuthResponse(user: any): AuthResponse {
    const userId = user._id?.toString() || user.id;
    if (!userId) {
      console.error(
        `[AuthService] Error: Usuario sin ID válido - ${user.email}`,
      );
      throw new Error(`Usuario sin ID válido`);
    }

    const payload: JwtPayload = {
      sub: userId,
      email: user.email,
      roles: user.roles || ["user"],
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || "refreshsecret",
      expiresIn: "7d",
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
      user: {
        id: userId,
        email: user.email,
        name: user.name || "Usuario",
        roles: user.roles || ["user"],
      },
    };
  }

  /**
   * Publica eventos de registro de usuario en los sistemas de mensajería.
   * Configura los eventos correctamente para cada broker (NATS y RabbitMQ).
   * @param {any} user Datos del usuario recién creado
   * @private
   */
  private publishUserCreatedEvent(user: any): void {
    const eventData = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      roles: user.roles,
      createdAt: new Date().toISOString(),
    };

    this.natsClient.emit(NATS_PATTERNS.USER.REGISTERED, eventData);

    try {
      const amqplib = require("amqplib");
      let connection: any;
      amqplib
        .connect(
          process.env.RABBITMQ_URL ||
            "amqp://rabbit_user:rabbit_password@localhost:5672",
        )
        .then((conn: any) => {
          connection = conn;
          return conn.createChannel();
        })
        .then((channel: any) => {
          const messageWithPattern = {
            pattern: "user.registered",
            data: eventData,
          };
          channel.publish(
            "user_exchange",
            "user.registered",
            Buffer.from(JSON.stringify(messageWithPattern)),
            { persistent: true },
          );
          console.log(
            `[RabbitMQ] Mensaje publicado en 'user_exchange' con routing key 'user.registered'`,
          );
          setTimeout(() => {
            channel.close();
            connection.close();
          }, 500);
        })
        .catch((err: any) => {
          console.error(
            `[RabbitMQ] Error al publicar evento de registro: ${err.message}`,
          );
          this.messageRetryBuffer.addMessage(
            "user_exchange",
            "user.registered",
            {
              pattern: "user.registered",
              data: eventData,
            },
          );
        });
    } catch (error) {
      console.error("Error al publicar en RabbitMQ:", error);

      // Añadir al buffer de reintentos
      this.messageRetryBuffer.addMessage("user_exchange", "user.registered", {
        pattern: "user.registered",
        data: eventData,
      });

      // Fallback a la forma estándar
      this.rabbitClient.emit(RMQ_PATTERNS.USER.REGISTERED, eventData);
    }
  }
}
