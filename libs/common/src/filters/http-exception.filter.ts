import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";
import { BaseError } from "../errors/base.error";
import { LoggerService } from "../logger/logger.service";

/**
 * Filtro global para capturar y formatear excepciones HTTP
 * @class
 * @implements {ExceptionFilter}
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger: LoggerService;

  /**
   * Crea una nueva instancia del filtro de excepciones HTTP
   * @param {LoggerService} logger - Servicio de logging para registrar errores
   */
  constructor(logger: LoggerService) {
    this.logger = logger.setContext("ExceptionFilter");
  }

  /**
   * Captura y procesa las excepciones
   * @param {Error} exception - Excepción capturada
   * @param {ArgumentsHost} host - Host de argumentos de NestJS
   */
  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: Record<string, any> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof BaseError) {
      status = exception.statusCode;
      errorResponse = {
        ...exception.serialize(),
        path: request.url,
      };

      if (status >= 500) {
        this.logger.error(
          `[${exception.errorCode}] ${exception.message}`,
          exception.stack,
        );
      } else {
        this.logger.warn(`[${exception.errorCode}] ${exception.message}`);
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorResponse = {
        statusCode: status,
        errorCode: "HTTP_EXCEPTION",
        message: exception.message,
        details:
          typeof exceptionResponse === "object"
            ? exceptionResponse
            : { error: exceptionResponse },
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      this.logger.warn(`[HTTP_EXCEPTION] ${exception.message}`);
    } else {
      errorResponse = {
        statusCode: status,
        errorCode: "INTERNAL_SERVER_ERROR",
        message: "Error interno del servidor",
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      this.logger.error(
        `[UNHANDLED_ERROR] ${exception.message}`,
        exception.stack,
      );

      // En producción, no exponemos detalles del error interno
      if (process.env.NODE_ENV !== "production") {
        errorResponse.details = {
          originalMessage: exception.message,
          stack: exception.stack,
        };
      }
    }

    response.status(status).json(errorResponse);
  }
}
