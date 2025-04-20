import { envs } from "./envs";

/**
 * Configuración centralizada del servicio Monolito.
 * Gestiona todas las configuraciones del servicio con validación de variables de entorno.
 */
export const MonolithConfig = {
  /**
   * Configuración del entorno
   */
  environment: {
    nodeEnv: envs.nodeEnv,
    isDevelopment: envs.isDevelopment,
    isProduction: envs.isProduction,
    isLocalhost: envs.isLocalhost,
  },

  /**
   * Configuración del servidor
   */
  server: {
    port: envs.port,
    host: process.env.HOST || "localhost",
    apiPrefix: process.env.API_PREFIX || "api",
    swaggerPrefix: process.env.SWAGGER_PREFIX || "docs",
  },

  /**
   * Configuración de la base de datos
   */
  database: {
    uri: envs.mongoDbUri,
    dbName: envs.dbName,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: envs.isDevelopment,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      keepAlive: true,
      maxPoolSize: 50,
      minPoolSize: 10,
    },
  },

  /**
   * Configuraciones de seguridad
   */
  security: {
    cors: {
      origin: envs.corsOrigin || "*",
      methods: (
        process.env.CORS_METHODS || "GET,HEAD,PUT,PATCH,POST,DELETE"
      ).split(","),
      credentials: process.env.CORS_CREDENTIALS === "true",
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
      max: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    },
  },

  /**
   * Configuración de autenticación JWT
   */
  jwt: {
    secret: envs.jwtSecret,
    expiresIn: envs.jwtExpiresIn,
    refreshSecret: envs.jwtRefreshSecret,
    refreshExpiresIn: parseInt(
      process.env.JWT_REFRESH_EXPIRES_IN || "604800",
      10,
    ),
    expiresInString: process.env.JWT_EXPIRES_IN_STRING || "1h",
  },

  /**
   * Configuración de servicios de mensajería
   */
  messaging: {
    nats: {
      url: envs.natsUrl,
      user: process.env.NATS_USER || "",
      pass: process.env.NATS_PASS || "",
    },
    rabbitmq: {
      url: envs.rabbitmqUrl,
      user: envs.rabbitmqUser,
      pass: envs.rabbitmqPass,
      queueName: envs.rabbitmqQueue,
      prefetch: parseInt(process.env.RABBITMQ_PREFETCH || "10", 10),
      queueOptions: {
        durable: process.env.RABBITMQ_QUEUE_DURABLE !== "false",
      },
    },
  },

  /**
   * Configuración de registro de logs
   */
  logging: {
    level: envs.logLevel || "info",
    pretty: process.env.LOG_PRETTY !== "false",
  },

  /**
   * Configuración de documentación Swagger
   */
  swagger: {
    title: process.env.SWAGGER_TITLE || "API Monolito DDD",
    description:
      process.env.SWAGGER_DESCRIPTION ||
      "API del Monolito basado en Diseño Dirigido por Dominio (DDD) con arquitectura hexagonal",
    version: process.env.SWAGGER_VERSION || "1.0",
    tag: process.env.SWAGGER_TAG || "api",

    contactName: process.env.SWAGGER_CONTACT_NAME || "Equipo de Desarrollo",
    contactEmail: process.env.SWAGGER_CONTACT_EMAIL || "desarrollo@ejemplo.com",
    contactUrl: process.env.SWAGGER_CONTACT_URL || "https://ejemplo.com",
    tags: [
      {
        name: "Usuarios",
        description: "Gestión de usuarios y autenticación",
      },
      {
        name: "Productos",
        description: "Operaciones relacionadas con productos",
      },
      {
        name: "Pedidos",
        description: "Gestión de pedidos y transacciones",
      },
      {
        name: "Sistema",
        description: "Operaciones de infraestructura y monitoreo",
      },
    ],
  },
};
