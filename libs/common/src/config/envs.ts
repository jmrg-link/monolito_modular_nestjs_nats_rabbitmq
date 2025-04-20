/**
 * Validación de variables de entorno usando env-var
 * @module Common/Config
 */
import * as env from "env-var";

/**
 * Entornos soportados por la aplicación
 */
export enum Environment {
  Development = "development",
  Production = "production",
  Localhost = "localhost",
  Test = "test",
}

/**
 * Obtiene el valor del entorno actual
 * @returns Entorno actual (development, production, localhost o test)
 */
export const getEnvironment = (): Environment => {
  const environment = env.get("NODE_ENV").default("development").asString();
  return environment as Environment;
};

/**
 * Verifica si la aplicación está en modo producción
 * @returns verdadero si está en producción
 */
export const isProduction = (): boolean => {
  return getEnvironment() === Environment.Production;
};

/**
 * Verifica si la aplicación está en modo desarrollo
 * @returns verdadero si está en desarrollo
 */
export const isDevelopment = (): boolean => {
  return getEnvironment() === Environment.Development;
};

/**
 * Verifica si la aplicación está en modo localhost
 * @returns verdadero si está en localhost
 */
export const isLocalhost = (): boolean => {
  return getEnvironment() === Environment.Localhost;
};

/**
 * Verifica si la aplicación está en modo test
 * @returns verdadero si está en test
 */
export const isTest = (): boolean => {
  return getEnvironment() === Environment.Test;
};

/**
 * Obtiene el nombre del archivo .env adecuado según el entorno
 * @returns Nombre del archivo .env para el entorno actual
 */
export const getEnvFileName = (): string => {
  const env = getEnvironment();

  switch (env) {
    case Environment.Development:
      return ".env.development";
    case Environment.Test:
      return ".env.test";
    case Environment.Localhost:
      return ".env.localhost";
    case Environment.Production:
    default:
      return ".env";
  }
};
