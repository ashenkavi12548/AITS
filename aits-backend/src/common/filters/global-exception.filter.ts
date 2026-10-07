import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

export interface ErrorResponseFormat {
  success: boolean;
  statusCode: number;
  message: string | string[];
  error: string;
  code: string;
  details?: { field: string; message: string }[];
  path: string;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorName = 'Internal Server Error';
    let message: string | string[] =
      'An unexpected server error occurred. Please try again.';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: { field: string; message: string }[] | undefined = undefined;

    // 1. Standard NestJS HttpExceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
        errorName = exception.name;
        code = exception.name.toUpperCase().replace('EXCEPTION', '_ERROR');
      } else if (typeof res === 'object' && res !== null) {
        const responseObj = res as Record<string, unknown>;
        message =
          (responseObj.message as string | string[]) ||
          exception.message ||
          'Request failed';

        // Translate "Cannot GET /..." routing errors
        if (typeof message === 'string' && message.startsWith('Cannot ')) {
          message =
            'The requested service or information is currently unavailable. Please try again.';
          code = 'ROUTE_NOT_FOUND';
        }

        errorName =
          (responseObj.error as string) ||
          exception.name.replace('Exception', '');

        if (!code) {
          code =
            (responseObj.code as string) ||
            errorName.toUpperCase().replace(/\s+/g, '_');
        }

        if (Array.isArray(responseObj.details)) {
          details = responseObj.details as { field: string; message: string }[];
        }
      }
    }
    // 2. Prisma Known Request Exceptions
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2000': {
          status = HttpStatus.BAD_REQUEST;
          errorName = 'Bad Request';
          code = 'INPUT_TOO_LONG';
          message =
            'Provided value for a database column exceeds the maximum allowed length.';
          break;
        }
        case 'P2001':
        case 'P2025': {
          status = HttpStatus.NOT_FOUND;
          errorName = 'Not Found';
          code = 'RESOURCE_NOT_FOUND';
          message = 'The requested resource was not found.';
          break;
        }
        case 'P2002': {
          status = HttpStatus.CONFLICT;
          errorName = 'Conflict';
          code = 'RESOURCE_ALREADY_EXISTS';
          const target = exception.meta?.target;
          const targetField =
            typeof target === 'string'
              ? target
              : Array.isArray(target)
                ? target.map((t) => String(t)).join(', ')
                : 'field';
          message = `A resource with this ${targetField} already exists.`;
          break;
        }
        case 'P2003': {
          status = HttpStatus.BAD_REQUEST;
          errorName = 'Bad Request';
          code = 'FOREIGN_KEY_VIOLATION';
          const field = exception.meta?.field_name;
          const fieldName =
            typeof field === 'string' ? field : 'referenced relation';
          message = `Invalid reference on ${fieldName}. The referenced resource does not exist.`;
          break;
        }
        case 'P2014': {
          status = HttpStatus.BAD_REQUEST;
          errorName = 'Bad Request';
          code = 'RELATION_CONSTRAINT_VIOLATION';
          message =
            'The requested change would violate a required relationship between resources.';
          break;
        }
        default: {
          if (exception.code.startsWith('P1')) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            errorName = 'Service Unavailable';
            code = 'DATABASE_CONNECTION_ERROR';
            message = `Database connection issue. Please try again later.`;
          } else {
            status = HttpStatus.BAD_REQUEST;
            errorName = 'Bad Request';
            code = 'DATABASE_QUERY_ERROR';
            message = `Invalid database operation requested.`;
          }
        }
      }
    } else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      errorName = 'Service Unavailable';
      code = 'DATABASE_UNAVAILABLE';
      message = 'Cannot connect to the database server at this time.';
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      errorName = 'Bad Request';
      code = 'DATABASE_VALIDATION_ERROR';
      message = 'Invalid data provided for database operation.';
    } else if (
      exception instanceof Prisma.PrismaClientRustPanicError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError
    ) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorName = 'Internal Server Error';
      code = 'DATABASE_INTERNAL_ERROR';
      message = 'An unexpected database error occurred.';
    } else if (exception instanceof Error) {
      message = exception.message;
      errorName = exception.name || 'Application Error';
      code = 'APPLICATION_ERROR';
    }

    const path = request?.url || '';
    const method = request?.method || '';
    const numericStatus = Number(status);

    if (numericStatus >= 500) {
      this.logger.error(
        `[${method} ${path}] ${numericStatus} ${errorName} (${code}): ${Array.isArray(message) ? message.join(', ') : message}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${method} ${path}] ${numericStatus} ${errorName} (${code}): ${Array.isArray(message) ? message.join(', ') : message}`,
      );
    }

    const errorPayload: ErrorResponseFormat = {
      success: false,
      statusCode: status,
      message,
      error: errorName,
      code,
      path,
      timestamp: new Date().toISOString(),
    };

    if (details && details.length > 0) {
      errorPayload.details = details;
    }

    response.status(status).json(errorPayload);
  }
}
