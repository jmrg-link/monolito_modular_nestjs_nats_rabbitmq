import * as env from "env-var";

/**
 * API Gateway Configuration
 * Centralized configuration for all API Gateway service settings,
 * loading values from environment variables with validation.
 */
export const ApiGatewayConfig = {
  /**
   * Environment identification and metadata
   */
  environment: {
    nodeEnv: env.get("NODE_ENV").default("development").asString(),
    isDevelopment:
      env.get("NODE_ENV").default("development").asString() === "development",
    isProduction:
      env.get("NODE_ENV").default("development").asString() === "production",
    isTest: env.get("NODE_ENV").default("development").asString() === "test",
  },

  /**
   * HTTP server configuration
   */
  server: {
    port: env.get("PORT").default(3000).asPortNumber(),
    host: env.get("HOST").default("localhost").asString(),
    apiPrefix: env.get("API_PREFIX").default("api").asString(),
    swaggerPrefix: env.get("SWAGGER_PREFIX").default("docs").asString(),
  },

  /**
   * Security configurations for the API Gateway
   */
  security: {
    cors: {
      origin: env.get("CORS_ORIGIN").default("*").asString(),
      methods: env
        .get("CORS_METHODS")
        .default("GET,HEAD,PUT,PATCH,POST,DELETE")
        .asString()
        .split(","),
      credentials: env.get("CORS_CREDENTIALS").default("false").asBool(),
      allowedHeaders: env
        .get("CORS_ALLOWED_HEADERS")
        .default("Content-Type,Authorization")
        .asString(),
      exposedHeaders: env.get("CORS_EXPOSED_HEADERS").default("").asString(),
    },
    rateLimit: {
      windowMs: env.get("RATE_LIMIT_WINDOW_MS").default(60000).asIntPositive(),
      max: env.get("RATE_LIMIT_MAX").default(100).asIntPositive(),
    },
    helmet: {
      contentSecurityPolicy: env.get("HELMET_CSP").default("true").asBool(),
      xssFilter: env.get("HELMET_XSS").default("true").asBool(),
    },
  },

  /**
   * JWT authentication configuration
   */
  jwt: {
    secret: env
      .get("JWT_SECRET")
      .required()
      .default("dev-secret-key-change-in-production")
      .asString(),
    expiresIn: env.get("JWT_EXPIRES_IN").default("1h").asString(),
    refreshSecret: env
      .get("JWT_REFRESH_SECRET")
      .required()
      .default("dev-refresh-secret-change-in-production")
      .asString(),
    refreshExpiresIn: env
      .get("JWT_REFRESH_EXPIRES_IN")
      .default("7d")
      .asString(),
  },

  /**
   * Messaging service configuration for microservice communication
   */
  messaging: {
    nats: {
      url: env.get("NATS_URL").default("nats://localhost:4222").asString(),
      user: env.get("NATS_USER").default("").asString(),
      pass: env.get("NATS_PASS").default("").asString(),
    },
    rabbitmq: {
      url: env
        .get("RABBITMQ_URL")
        .default("amqp://guest:guest@localhost:5672")
        .asString(),
      user: env.get("RABBITMQ_USER").default("rabbit_user").asString(),
      pass: env.get("RABBITMQ_PASS").default("rabbit_password").asString(),
      queue: env.get("RABBITMQ_QUEUE").default("main_queue").asString(),
      prefetch: env.get("RABBITMQ_PREFETCH").default(10).asIntPositive(),
      queueOptions: {
        durable: env.get("RABBITMQ_QUEUE_DURABLE").default("true").asBool(),
      },
    },
  },

  /**
   * Application logging configuration
   */
  logging: {
    level: env
      .get("LOG_LEVEL")
      .default("info")
      .asEnum(["error", "warn", "info", "debug", "verbose"]),
    pretty: env.get("LOG_PRETTY").default("true").asBool(),
  },

  /**
   * Data caching configuration
   */
  cache: {
    ttl: env.get("CACHE_TTL").default(300).asIntPositive(),
    maxItems: env.get("CACHE_MAX_ITEMS").default(1000).asIntPositive(),
    checkPeriod: env.get("CACHE_CHECK_PERIOD").default(600).asIntPositive(),
  },

  /**
   * External microservices connection settings
   */
  services: {
    users: {
      url: env
        .get("USERS_SERVICE_URL")
        .default("http://localhost:3001")
        .asString(),
      timeout: env.get("USERS_SERVICE_TIMEOUT").default(5000).asIntPositive(),
    },
    products: {
      url: env
        .get("PRODUCTS_SERVICE_URL")
        .default("http://localhost:3002")
        .asString(),
      timeout: env
        .get("PRODUCTS_SERVICE_TIMEOUT")
        .default(5000)
        .asIntPositive(),
    },
    orders: {
      url: env
        .get("ORDERS_SERVICE_URL")
        .default("http://localhost:3003")
        .asString(),
      timeout: env.get("ORDERS_SERVICE_TIMEOUT").default(5000).asIntPositive(),
    },
  },

  /**
   * Swagger documentation configuration
   */
  swagger: {
    title: env.get("SWAGGER_TITLE").default("API Gateway").asString(),
    description: env
      .get("SWAGGER_DESCRIPTION")
      .default("Distributed Microservices API Gateway")
      .asString(),
    version: env.get("SWAGGER_VERSION").default("1.0").asString(),
    tag: env.get("SWAGGER_TAG").default("api").asString(),
  },
};
