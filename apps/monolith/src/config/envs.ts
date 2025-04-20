import * as env from "env-var";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

/**
 * Cargar variables de entorno desde un archivo .env específico según el entorno de ejecución.
 * Se carga primero el archivo .env.<NODE_ENV> y luego el archivo .env por defecto.
 * Si no se encuentra ninguno, se utilizan las variables de entorno del sistema.
 */

const loadEnvFile = () => {
  const nodeEnv = process.env.NODE_ENV || "development";
  const envFilePath = path.resolve(process.cwd(), `.env.${nodeEnv}`);
  const defaultEnvPath = path.resolve(process.cwd(), ".env");

  if (fs.existsSync(envFilePath)) {
    // console.log(`Cargando variables de entorno desde ${envFilePath}`);
    dotenv.config({ path: envFilePath });
  } else if (fs.existsSync(defaultEnvPath)) {
    // console.log(`Cargando variables de entorno desde ${defaultEnvPath}`);
    dotenv.config({ path: defaultEnvPath });
  } else {
    console.warn(
      "No se encontró ningún archivo .env. Usando variables de entorno del sistema.",
    );
  }
};

loadEnvFile();

const {
  NODE_ENV,
  PORT,
  HOST,
  NATS_URL,
  MONGODB_URI,
  MONGODB_DBNAME,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN,
  RABBITMQ_URL,
  RABBITMQ_USER,
  RABBITMQ_PASS,
  RABBITMQ_QUEUE,
  PORT_MONOLITH,
  LOG_LEVEL,
  CORS_ORIGIN,
} = process.env;

/**
 * Validación de variables de entorno para el monolito
 */
export const envs = {
  nodeEnv: env
    .get("NODE_ENV")
    .asEnum(["development", "production", "localhost"]),
  mongoDbUri: env.get("MONGODB_URI").default(`${MONGODB_URI}`).asString(),
  dbName: env.get("MONGODB_DBNAME").default(`${MONGODB_DBNAME}`).asString(),
  jwtSecret: env.get("JWT_SECRET").default(`${JWT_SECRET}`).asString(),
  jwtRefreshSecret: env
    .get("JWT_REFRESH_SECRET")
    .default(`${JWT_REFRESH_SECRET}`)
    .asString(),
  jwtExpiresIn: env
    .get("JWT_EXPIRES_IN")
    .default(`${JWT_EXPIRES_IN}`)
    .asIntPositive(),
  natsUrl: env.get("NATS_URL").default(`${NATS_URL}`).asString(),
  rabbitmqUrl: env.get("RABBITMQ_URL").default(`${RABBITMQ_URL}`).asString(),
  rabbitmqUser: env.get("RABBITMQ_USER").default(`${RABBITMQ_USER}`).asString(),
  rabbitmqPass: env.get("RABBITMQ_PASS").default(`${RABBITMQ_PASS}`).asString(),
  rabbitmqQueue: env
    .get("RABBITMQ_QUEUE")
    .default(`${RABBITMQ_QUEUE}`)
    .asString(),
  port: env.get("PORT_MONOLITH").default(`${PORT_MONOLITH}`).asPortNumber(),
  corsOrigin: env.get("CORS_ORIGIN").default(`${CORS_ORIGIN}`).asString(),
  logLevel: env
    .get("LOG_LEVEL")
    .default(`${LOG_LEVEL}`)
    .asEnum(["debug", "info", "warn", "error"]),
  isDevelopment: NODE_ENV === "development",
  isProduction: NODE_ENV === "production",
  isLocalhost: NODE_ENV === "localhost",
  host: env.get("HOST").default(`${HOST}`).asString(),
  apiPort: env.get("PORT").default(`${PORT}`).asPortNumber(),
};
