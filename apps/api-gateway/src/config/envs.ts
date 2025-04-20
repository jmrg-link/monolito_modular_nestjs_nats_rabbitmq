import * as env from "env-var";

/**
 * Environment variables validation and access.
 * Provides strongly-typed access to all environment variables with validation.
 */
export const envs = {
  /**
   * Current Node.js runtime environment
   */
  nodeEnv: env
    .get("NODE_ENV")
    .default("development")
    .asEnum(["development", "production", "test", "localhost"]),

  /**
   * Application metadata
   */
  appName: env.get("APP_NAME").default("NestJS API Gateway").asString(),
  appVersion: env.get("APP_VERSION").default("1.0.0").asString(),

  /**
   * Server configuration parameters
   */
  port: env.get("PORT").default(3000).asPortNumber(),
  host: env.get("HOST").default("localhost").asString(),
  apiPrefix: env.get("API_PREFIX").default("api").asString(),

  /**
   * Cross-Origin Resource Sharing configuration
   */
  corsOrigin: env.get("CORS_ORIGIN").default("*").asString(),
  corsCredentials: env.get("CORS_CREDENTIALS").default("false").asBool(),

  /**
   * API rate limiting protection
   */
  rateLimit: env.get("RATE_LIMIT").default(100).asIntPositive(),
  rateLimitWindowMs: env
    .get("RATE_LIMIT_WINDOW_MS")
    .default(60000)
    .asIntPositive(),

  /**
   * JWT token configuration
   */
  jwtSecret: env.get("JWT_SECRET").required().asString(),
  jwtExpiresIn: env.get("JWT_EXPIRES_IN").default("3600").asString(),
  jwtRefreshSecret: env.get("JWT_REFRESH_SECRET").required().asString(),
  jwtRefreshExpiresIn: env
    .get("JWT_REFRESH_EXPIRES_IN")
    .default("604800")
    .asString(),

  /**
   * Messaging service connection parameters
   */
  natsUrl: env.get("NATS_URL").default("nats://localhost:4222").asString(),
  rabbitmqUrl: env
    .get("RABBITMQ_URL")
    .default("amqp://guest:guest@localhost:5672")
    .asString(),
  rabbitmqUser: env.get("RABBITMQ_USER").default("rabbit_user").asString(),
  rabbitmqPass: env.get("RABBITMQ_PASS").default("rabbit_password").asString(),
  rabbitmqQueue: env.get("RABBITMQ_QUEUE").default("main_queue").asString(),

  /**
   * Application logging settings
   */
  logLevel: env
    .get("LOG_LEVEL")
    .default("info")
    .asEnum(["error", "warn", "info", "debug", "verbose"]),

  /**
   * Cache configuration
   */
  cacheTtl: env.get("CACHE_TTL").default(300).asIntPositive(),
  cacheMaxItems: env.get("CACHE_MAX_ITEMS").default(1000).asIntPositive(),

  /**
   * Environment helper flags
   */
  isDevelopment:
    env.get("NODE_ENV").default("development").asString() === "development",
  isProduction:
    env.get("NODE_ENV").default("development").asString() === "production",
  isTest: env.get("NODE_ENV").default("development").asString() === "test",

  /**
   * Microservice connection URLs
   */
  usersServiceUrl: env
    .get("USERS_SERVICE_URL")
    .default("http://localhost:3001")
    .asString(),
  productsServiceUrl: env
    .get("PRODUCTS_SERVICE_URL")
    .default("http://localhost:3002")
    .asString(),
  ordersServiceUrl: env
    .get("ORDERS_SERVICE_URL")
    .default("http://localhost:3003")
    .asString(),
};

/**
 * Checks if application is running in production mode
 * @returns {boolean} True if running in production environment
 */
export const isProduction = (): boolean => envs.nodeEnv === "production";

/**
 * Checks if application is running in development mode
 * @returns {boolean} True if running in development environment
 */
export const isDevelopment = (): boolean => envs.nodeEnv === "development";

/**
 * Checks if application is running in test mode
 * @returns {boolean} True if running in test environment
 */
export const isTest = (): boolean => envs.nodeEnv === "test";
