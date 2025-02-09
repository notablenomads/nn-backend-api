import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { MonitoringService } from '../services/monitoring.service';

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(private readonly monitoringService: MonitoringService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const className = context.getClass().name;
    const methodName = context.getHandler().name;
    const correlationId = request.headers['x-correlation-id'];
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;

        // Log performance metric
        this.monitoringService.logPerformanceMetric({
          type: 'performance',
          className,
          methodName,
          duration,
          correlationId,
          metadata: {
            path: request.path,
            method: request.method,
          },
        });

        // Log memory usage for resource-intensive operations (duration > 1000ms)
        if (duration > 1000) {
          this.monitoringService.logMemoryUsage(className, methodName, correlationId);
        }
      }),
    );
  }
}
