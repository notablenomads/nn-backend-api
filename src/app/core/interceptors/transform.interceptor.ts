import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpStatus } from '@nestjs/common';

export interface IResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, IResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<IResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        // If the data is already in our response format, return it as is
        if (this.isResponseFormat(data)) {
          return {
            ...data,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }

        // Otherwise, wrap it in our standard response format
        return {
          statusCode: response.statusCode || HttpStatus.OK,
          message: this.getSuccessMessage(request.method, request.url),
          data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }),
    );
  }

  private isResponseFormat(data: any): boolean {
    return data && typeof data === 'object' && 'statusCode' in data && 'message' in data && 'data' in data;
  }

  private getSuccessMessage(method: string, url: string): string {
    // Special cases based on URL
    if (url.includes('/auth/logout')) {
      return 'Logged out successfully';
    }
    if (url.includes('/auth/logout-all')) {
      return 'Logged out from all sessions successfully';
    }

    // Default cases based on HTTP method
    switch (method.toUpperCase()) {
      case 'POST':
        return 'Resource created successfully';
      case 'PUT':
      case 'PATCH':
        return 'Resource updated successfully';
      case 'DELETE':
        return 'Resource deleted successfully';
      default:
        return 'Request processed successfully';
    }
  }
}
