import * as Sentry from '@sentry/node';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
export class MonitoringService implements OnModuleInit {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly environment: string;

  constructor(private readonly configService: ConfigService) {
    this.environment = this.configService.get<string>('app.nodeEnv', 'development');
  }

  onModuleInit() {
    const dsn = this.configService.get<string>('sentry.dsn');
    if (dsn && this.environment === 'production') {
      Sentry.init({
        dsn,
        environment: this.environment,
        tracesSampleRate: 1.0,
        enabled: this.environment === 'production',
        beforeSend(event) {
          // Sanitize error events in non-production environments
          if (event.environment !== 'production') {
            delete event.user;
            event.request = {};
          }
          return event;
        },
      });
    }
  }

  logPerformanceMetric(metric: Omit<IPerformanceMetric, 'timestamp'>) {
    const enrichedMetric: IPerformanceMetric = {
      ...metric,
      timestamp: new Date().toISOString(),
    };

    // Log in JSON format for easier parsing
    this.logger.log(JSON.stringify(enrichedMetric));

    // Send to external monitoring services in production
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

    // Send error to Sentry in production
    if (this.environment === 'production') {
      Sentry.withScope((scope) => {
        if (correlationId) {
          scope.setTag('correlationId', correlationId);
        }
        if (metadata) {
          scope.setExtras(metadata);
        }
        Sentry.captureException(error);
      });
    }
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
    if (metric.type === 'performance' && metric.duration) {
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${metric.className}.${metric.methodName}`,
        data: {
          duration: metric.duration,
          path: metric.metadata?.path,
          method: metric.metadata?.method,
        },
      });
    }
  }
}
