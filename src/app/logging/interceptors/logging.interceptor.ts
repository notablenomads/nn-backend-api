import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { LogLevel, LogActionType } from '../entities/log-entry.entity';
import { LoggingService } from '../services/logging.service';
import { ILogOptions } from '../services/logging.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);
  private readonly API_PREFIX = 'v1';
  private readonly HEALTH_PATH = 'health';

  constructor(private readonly loggingService: LoggingService) {}

  private isHealthCheckRequest(url: string): boolean {
    // Handle both /v1/health/* and /health/* paths
    const normalizedPath = url.startsWith('/') ? url.substring(1) : url;
    const pathParts = normalizedPath.split('/');

    // Check if it's a health endpoint with or without the API prefix
    return (pathParts[0] === this.API_PREFIX && pathParts[1] === this.HEALTH_PATH) || pathParts[0] === this.HEALTH_PATH;
  }

  private shouldLogRequest(request: Request): boolean {
    // Skip logging for health check endpoints
    if (this.isHealthCheckRequest(request.url)) {
      return false;
    }

    // Always log errors and non-GET requests
    if (request.method !== 'GET') {
      return true;
    }

    // For GET requests, only log if they're not excluded
    return true;
  }

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip logging for unimportant requests
    if (!this.shouldLogRequest(request)) {
      return next.handle();
    }

    const startTime = Date.now();

    const logOptions: ILogOptions = {
      ipAddress: request.ip,
      requestId: request['requestId'],
      correlationId: request['correlationId'],
      request: {
        method: request.method,
        url: request.url,
      },
    };

    return next.handle().pipe(
      tap({
        next: (responseData: any) => {
          const duration = Date.now() - startTime;
          const response = context.switchToHttp().getResponse();
          this.loggingService.log(LogLevel.INFO, 'API Request completed', LogActionType.API_REQUEST, {
            ...logOptions,
            metadata: {
              duration,
              statusCode: response.statusCode,
              responseType: typeof responseData,
            },
          });
        },
        error: (error: any) => {
          const duration = Date.now() - startTime;
          this.loggingService.log(LogLevel.ERROR, 'API Request failed', LogActionType.API_ERROR, {
            ...logOptions,
            metadata: {
              duration,
              error: error.message,
              stack: error.stack,
            },
            response: {
              statusCode: error.status || 500,
            },
          });
        },
      }),
    );
  }
}
