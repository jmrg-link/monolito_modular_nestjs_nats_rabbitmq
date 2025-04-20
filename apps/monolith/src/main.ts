import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { MicroserviceOptions } from "@nestjs/microservices";
import helmet from "helmet";
import * as compression from "compression";
import * as amqplib from "amqplib";
import { AppModule } from "./app.module";
import { MonolithConfig } from "./config/app.config";
import {
  HttpExceptionFilter,
  LoggerModule,
  LoggerService,
  natsConfig,
} from "@libs/common";

/**
 * Función principal de arranque de la aplicación NestJS.
 * Configura y arranca la aplicación con sus microservicios, middleware y documentación.
 * @returns {Promise<void>} Promesa que se resuelve cuando la aplicación está en ejecución
 */
async function bootstrap() {
  LoggerService.setLogLevels(
    MonolithConfig.environment.nodeEnv || "development",
  );

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = new LoggerService().setContext("Bootstrap");
  app.useLogger(new LoggerService());

  const exceptionFilter = new HttpExceptionFilter(new LoggerService());
  app.useGlobalFilters(exceptionFilter);

  const natsUrl = process.env.NATS_URL || "nats://localhost:4222";
  app.connectMicroservice<MicroserviceOptions>(natsConfig);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const rabbitmqUrl =
    process.env.RABBITMQ_URL ||
    "amqp://rabbit_user:rabbit_password@localhost:5672";

  /**
   * Configura la infraestructura de RabbitMQ para el consumidor manual
   * @returns {Promise<void>} Promesa que se resuelve cuando la configuración está completa
   */
  try {
    // Primero asegurarnos de que el exchange de letra muerta exista
    const connection = await amqplib.connect(rabbitmqUrl);
    const channel = await connection.createChannel();
    await channel.assertExchange("dlx_exchange", "topic", { durable: true });

    // Luego crear la cola DLQ
    await channel.assertQueue("dead_letter_queue", { durable: true });
    await channel.bindQueue("dead_letter_queue", "dlx_exchange", "dead.#");

    // Finalmente recrear las colas de usuario
    const { recreateQueue } = await import(
      "./messaging/rabbitmq/rabbitmq.util"
    );
    await recreateQueue("user_events");

    await channel.close();
    await connection.close();

    // Configuración manual de exchanges, colas y bindings en RabbitMQ
    const { setupRabbitMQInfrastructure } = await import(
      "./messaging/rabbitmq/rabbitmq.util"
    );
    await setupRabbitMQInfrastructure();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.warn(`No se pudo conectar con RabbitMQ: ${errorMessage}`);
    logger.warn("Continuando sin verificación de RabbitMQ");
  }

  app.setGlobalPrefix(MonolithConfig.server.apiPrefix);
  app.use(helmet());
  app.use(compression());
  app.enableCors(MonolithConfig.security.cors);
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
    .setTitle(MonolithConfig.swagger.title)
    .setDescription(MonolithConfig.swagger.description)
    .setVersion(MonolithConfig.swagger.version)
    .setContact(
      MonolithConfig.swagger.contactName,
      MonolithConfig.swagger.contactUrl,
      MonolithConfig.swagger.contactEmail,
    )
    .addServer(
      `http://${MonolithConfig.server.host}:${MonolithConfig.server.port}`,
      "Servidor de desarrollo",
    )
    .addServer("https://api-staging.ejemplo.com", "Servidor de pruebas")
    .addServer("https://api.ejemplo.com", "Servidor de producción")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Ingresa tu token JWT",
        in: "header",
      },
      "access-token",
    )
    .addTag("Usuarios", "Gestión de usuarios y autenticación")
    .addTag("Productos", "Operaciones relacionadas con productos")
    .addTag("Pedidos", "Gestión de pedidos y transacciones")
    .addTag("Sistema", "Operaciones de infraestructura y monitoreo")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup(MonolithConfig.server.swaggerPrefix, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "none",
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
      displayRequestDuration: true,
      tagsSorter: "alpha",
      operationsSorter: "alpha",
    },
    customSiteTitle: "API Monolito DDD - Documentación",
    customCss: ".swagger-ui .topbar { display: none }",
    customfavIcon: "/assets/favicon.ico",
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  await app.startAllMicroservices();

  const port = MonolithConfig.server.port;
  const host = MonolithConfig.server.host;
  await app.listen(port, host);

  logger.log(
    `Servidor Monolito inicializado en ${host}:${port} (Entorno: ${MonolithConfig.environment.nodeEnv})`,
  );
  logger.log(
    `Documentación disponible en http://${host}:${port}/${MonolithConfig.server.swaggerPrefix}`,
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
