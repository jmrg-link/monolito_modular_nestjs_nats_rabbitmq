import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import * as compression from "compression";
import { rateLimit } from "express-rate-limit";
import { AppModule } from "./app.module";
import { ApiGatewayConfig } from "./config/app.config";
import { HttpExceptionFilter, LoggerModule, LoggerService } from "@libs/common";

/**
 * Carga la configuración de entorno según el valor de NODE_ENV.
 * Detecta y utiliza el archivo .env apropiado para el entorno actual.
 * @returns {Promise<void>} Promesa que se resuelve cuando la configuración ha sido cargada
 */
async function loadEnvironmentConfig() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const envFile = nodeEnv === "production" ? ".env" : `.env.${nodeEnv}`;

  require("dotenv").config({
    path: envFile,
  });
}

/**
 * Función principal de inicialización de la aplicación.
 * Configura middleware, seguridad, validación y documentación.
 * @returns {Promise<void>} Promesa que se resuelve cuando la aplicación está en ejecución
 */
async function bootstrap() {
  await loadEnvironmentConfig();

  LoggerService.setLogLevels(
    ApiGatewayConfig.environment.nodeEnv || "development",
  );

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = new LoggerService().setContext("Bootstrap");
  app.useLogger(new LoggerService());

  const exceptionFilter = new HttpExceptionFilter(new LoggerService());
  app.useGlobalFilters(exceptionFilter);

  app.use(helmet());
  app.use(compression());
  app.use(
    rateLimit({
      windowMs: ApiGatewayConfig.security.rateLimit.windowMs,
      max: ApiGatewayConfig.security.rateLimit.max,
      message: { error: "Too many requests, please try again later." },
    }),
  );

  app.enableCors(ApiGatewayConfig.security.cors);
  app.setGlobalPrefix(ApiGatewayConfig.server.apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle(ApiGatewayConfig.swagger.title)
    .setDescription(ApiGatewayConfig.swagger.description)
    .setVersion(ApiGatewayConfig.swagger.version)
    .addTag("Autenticación", "Gestión de autenticación y usuarios")
    .addTag("Cache", "Operaciones de caché")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Introduce tu token JWT",
        in: "header",
      },
      "access-token",
    )
    .setContact(
      "Equipo de Desarrollo",
      "https://ejemplo.com",
      "desarrollo@ejemplo.com",
    )
    .addServer(
      `http://${ApiGatewayConfig.server.host}:${ApiGatewayConfig.server.port}`,
      "Servidor local",
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup(ApiGatewayConfig.server.swaggerPrefix, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "none",
      tagsSorter: "alpha",
      operationsSorter: "alpha",
      defaultModelsExpandDepth: 1,
    },
    customSiteTitle: "API Gateway - Documentación",
  });

  const port = ApiGatewayConfig.server.port;
  const host = ApiGatewayConfig.server.host;

  await app.listen(port, host);

  logger.log(
    `API Gateway inicializado en ${host}:${port} (Entorno: ${ApiGatewayConfig.environment.nodeEnv})`,
  );
  logger.log(
    `Documentación disponible en http://${host}:${port}/${ApiGatewayConfig.server.swaggerPrefix}`,
  );
}

/**
 * Inicia la aplicación y maneja errores de inicialización.
 * @returns {Promise<void>} Promesa que se resuelve cuando la aplicación termina
 */
bootstrap().catch((err) => {
  const logger = new LoggerService().setContext("Bootstrap");
  logger.error(`Error al iniciar la aplicación: ${err.message}`, err.stack);
  process.exit(1);
});
