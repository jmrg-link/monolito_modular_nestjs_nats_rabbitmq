import {
  Injectable,
  LoggerService as NestLoggerService,
  LogLevel,
  Scope,
} from "@nestjs/common";

/**
 * Servicio centralizado de logging con soporte para distintos niveles según entorno
 * @class
 */
@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService implements NestLoggerService {
  private context?: string;
  private static logLevels: LogLevel[] = [
    "error",
    "warn",
    "log",
    "debug",
    "verbose",
  ];

  /**
   * Establece el contexto para los mensajes de log
   * @param {string} context - Nombre del contexto para identificar el origen del log
   * @returns {this} Instancia del logger para encadenamiento de métodos
   */
  setContext(context: string): this {
    this.context = context;
    return this;
  }

  /**
   * Configura los niveles de log basados en el entorno
   * @param {string} environment - Entorno de ejecución (development, production, etc.)
   */
  static setLogLevels(environment: string): void {
    // En producción, limitamos los logs a niveles importantes
    if (environment === "production") {
      this.logLevels = ["error", "warn", "log"];
    } else if (environment === "test") {
      this.logLevels = ["error", "warn"];
    } else {
      // En desarrollo y otros entornos, permitimos todos los niveles
      this.logLevels = ["error", "warn", "log", "debug", "verbose"];
    }
  }

  /**
   * Verifica si un nivel de log está habilitado
   * @param {LogLevel} level - Nivel de log a verificar
   * @returns {boolean} True si el nivel está habilitado
   */
  private isLevelEnabled(level: LogLevel): boolean {
    return LoggerService.logLevels.includes(level);
  }

  /**
   * Registra un mensaje con nivel 'log'
   * @param {any} message - Mensaje a registrar
   * @param {string} [context] - Contexto opcional que sobrescribe el contexto configurado
   */
  log(message: any, context?: string): void {
    if (!this.isLevelEnabled("log")) return;

    const finalContext = context || this.context;
    const formattedMessage = this.formatMessage(message);

    if (finalContext) {
      console.log(`[${this.timestamp}] [${finalContext}] ${formattedMessage}`);
    } else {
      console.log(`[${this.timestamp}] ${formattedMessage}`);
    }
  }

  /**
   * Registra un mensaje con nivel 'error'
   * @param {any} message - Mensaje a registrar
   * @param {string} [stack] - Stack trace del error
   * @param {string} [context] - Contexto opcional que sobrescribe el contexto configurado
   */
  error(message: any, stack?: string, context?: string): void {
    if (!this.isLevelEnabled("error")) return;

    const finalContext = context || this.context;
    const formattedMessage = this.formatMessage(message);

    if (finalContext) {
      console.error(
        `[${this.timestamp}] [${finalContext}] ${formattedMessage}`,
      );
    } else {
      console.error(`[${this.timestamp}] ${formattedMessage}`);
    }

    if (stack) {
      console.error(stack);
    }
  }

  /**
   * Registra un mensaje con nivel 'warn'
   * @param {any} message - Mensaje a registrar
   * @param {string} [context] - Contexto opcional que sobrescribe el contexto configurado
   */
  warn(message: any, context?: string): void {
    if (!this.isLevelEnabled("warn")) return;

    const finalContext = context || this.context;
    const formattedMessage = this.formatMessage(message);

    if (finalContext) {
      console.warn(`[${this.timestamp}] [${finalContext}] ${formattedMessage}`);
    } else {
      console.warn(`[${this.timestamp}] ${formattedMessage}`);
    }
  }

  /**
   * Registra un mensaje con nivel 'debug'
   * @param {any} message - Mensaje a registrar
   * @param {string} [context] - Contexto opcional que sobrescribe el contexto configurado
   */
  debug(message: any, context?: string): void {
    if (!this.isLevelEnabled("debug")) return;

    const finalContext = context || this.context;
    const formattedMessage = this.formatMessage(message);

    if (finalContext) {
      console.debug(
        `[${this.timestamp}] [${finalContext}] ${formattedMessage}`,
      );
    } else {
      console.debug(`[${this.timestamp}] ${formattedMessage}`);
    }
  }

  /**
   * Registra un mensaje con nivel 'verbose'
   * @param {any} message - Mensaje a registrar
   * @param {string} [context] - Contexto opcional que sobrescribe el contexto configurado
   */
  verbose(message: any, context?: string): void {
    if (!this.isLevelEnabled("verbose")) return;

    const finalContext = context || this.context;
    const formattedMessage = this.formatMessage(message);

    if (finalContext) {
      console.log(
        `[${this.timestamp}] [VERBOSE] [${finalContext}] ${formattedMessage}`,
      );
    } else {
      console.log(`[${this.timestamp}] [VERBOSE] ${formattedMessage}`);
    }
  }

  /**
   * Obtiene el timestamp actual en formato ISO
   * @returns {string} Timestamp formateado
   * @private
   */
  private get timestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Formatea un mensaje para el log
   * @param {any} message - Mensaje a formatear
   * @returns {string} Mensaje formateado
   * @private
   */
  private formatMessage(message: any): string {
    if (typeof message === "object") {
      return JSON.stringify(message);
    }
    return message.toString();
  }
}
