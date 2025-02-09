import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface IPerformanceMetric {
  type: 'performance' | 'memory' | 'error' | 'request';
  className?: string;
  methodName?: string;
  duration?: number;
  memory?: {
    heapUsed: number;
    heapTotal: number;
  };
  error?: Error;
  request?: {
    method: string;
    path: string;
    statusCode: number;
    duration: number;
  };
  metadata?: Record<string, any>;
  timestamp: string;
  correlationId?: string;
}

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly environment: string;

  constructor(private readonly configService: ConfigService) {
    this.environment = this.configService.get<string>('app.nodeEnv', 'development');
  }

  logPerformanceMetric(metric: Omit<IPerformanceMetric, 'timestamp'>) {
    const enrichedMetric: IPerformanceMetric = {
      ...metric,
      timestamp: new Date().toISOString(),
    };

    // Log in JSON format for easier parsing
    this.logger.log(JSON.stringify(enrichedMetric));

    // In production, you might want to send this to an external monitoring service
    if (this.environment === 'production') {
      this.sendToExternalMonitoring(enrichedMetric);
    }
  }

  logMemoryUsage(className: string, methodName: string, correlationId?: string) {
    const memoryUsage = process.memoryUsage();

    this.logPerformanceMetric({
      type: 'memory',
      className,
      methodName,
      correlationId,
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
      },
    });
  }

  logError(error: Error, metadata?: Record<string, any>, correlationId?: string) {
    this.logPerformanceMetric({
      type: 'error',
      error,
      metadata,
      correlationId,
    });
  }

  logRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    correlationId?: string,
    metadata?: Record<string, any>,
  ) {
    this.logPerformanceMetric({
      type: 'request',
      request: {
        method,
        path,
        statusCode,
        duration,
      },
      metadata,
      correlationId,
    });
  }

  private sendToExternalMonitoring(metric: IPerformanceMetric) {
    // TODO: Implement sending to external monitoring service
    // This could be New Relic, Datadog, etc.
    // For now, we'll just log that we would send it
    this.logger.debug(`Would send metric to external monitoring: ${JSON.stringify(metric)}`);
  }
}
