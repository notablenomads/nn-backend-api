import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { LogLevel, LogActionType } from '../entities/log-entry.entity';
import { LoggingService } from '../services/logging.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const startTime = Date.now();
    const requestId = uuidv4();
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // Extract user ID if available
    const userId = request.user?.['id'];

    // Basic request information
    const requestInfo = {
      method: request.method,
      url: request.url,
      headers: this.sanitizeHeaders(request.headers),
      body: this.sanitizeBody(request.body),
    };

    // Log the incoming request
    this.loggingService.log(LogLevel.INFO, `Incoming ${request.method} ${request.url}`, LogActionType.API_REQUEST, {
      userId,
      requestId,
      ipAddress: request.ip,
      userAgent: request.get('user-agent'),
      request: requestInfo,
      component: 'api',
      metadata: {
        query: request.query,
        params: request.params,
      },
    });

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          const duration = Date.now() - startTime;

          // Log the successful response
          this.loggingService.log(
            LogLevel.INFO,
            `Completed ${request.method} ${request.url}`,
            LogActionType.API_RESPONSE,
            {
              userId,
              requestId,
              ipAddress: request.ip,
              userAgent: request.get('user-agent'),
              request: requestInfo,
              response: {
                statusCode: response.statusCode,
                headers: this.sanitizeHeaders(response.getHeaders()),
                body: this.sanitizeBody(data),
              },
              component: 'api',
              performanceMetrics: {
                duration,
              },
            },
          );
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;

          // Log the error response
          this.loggingService.logError(`Error processing ${request.method} ${request.url}`, error, {
            userId,
            requestId,
            ipAddress: request.ip,
            userAgent: request.get('user-agent'),
            request: requestInfo,
            response: {
              statusCode: response.statusCode,
              headers: this.sanitizeHeaders(response.getHeaders()),
            },
            component: 'api',
            performanceMetrics: {
              duration,
            },
          });
        },
      }),
    );
  }

  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie'];

    sensitiveHeaders.forEach((header) => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'key'];

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveFields.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
