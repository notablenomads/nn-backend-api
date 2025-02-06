import { Request, Response } from 'express';
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ERRORS } from '../errors/errors';
import { IErrorResponse } from '../errors/error.types';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: IErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // If it's already in our error format, use it directly
      if (this.isErrorResponse(exceptionResponse)) {
        errorResponse = exceptionResponse as IErrorResponse;
      } else if (typeof exceptionResponse === 'string') {
        // If it's a string, wrap it in our error format
        errorResponse = {
          message: 'Error',
          errors: {
            general: [exceptionResponse],
          },
        };
      } else {
        // If it's an object but not in our format, try to convert it
        const message = (exceptionResponse as any)?.message || 'Error';
        const errors = (exceptionResponse as any)?.errors || { general: [message] };
        errorResponse = { message, errors };
      }
    } else {
      // For unexpected errors, create a generic error response
      this.logger.error(exception.message, exception.stack);
      errorResponse = {
        message: ERRORS.GENERIC.INTERNAL_SERVER_ERROR.message,
        errors: {
          general: [exception.message || 'An unexpected error occurred'],
        },
      };
    }

    // Log the error details
    this.logger.error(
      `${request.method} ${request.url} - Status: ${status} - ${JSON.stringify(errorResponse)}`,
      exception.stack,
    );

    // Send the error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...errorResponse,
    });
  }

  private isErrorResponse(obj: any): obj is IErrorResponse {
    return (
      obj &&
      typeof obj === 'object' &&
      'message' in obj &&
      'errors' in obj &&
      typeof obj.message === 'string' &&
      typeof obj.errors === 'object'
    );
  }
}
