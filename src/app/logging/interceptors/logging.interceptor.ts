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

  constructor(private readonly loggingService: LoggingService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
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
