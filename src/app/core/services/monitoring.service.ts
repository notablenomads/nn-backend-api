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
  private readonly memoryThresholdMs: number;

  constructor(private readonly configService: ConfigService) {
    this.environment = this.configService.get<string>('app.nodeEnv', 'development');
    this.memoryThresholdMs = this.configService.get<number>('monitoring.memoryThresholdMs', 1000);
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
          // Always sanitize sensitive data regardless of environment
          if (event.request) {
            // Remove sensitive headers
            const sanitizedHeaders = { ...event.request.headers };
            ['authorization', 'cookie', 'x-api-key'].forEach((header) => delete sanitizedHeaders[header]);
            event.request.headers = sanitizedHeaders;

            // Remove query strings from URLs that might contain tokens
            if (event.request.url) {
              event.request.url = event.request.url.split('?')[0];
            }
          }

          // Sanitize error messages and stack traces
          if (event.exception) {
            event.exception.values = event.exception.values?.map((value) => ({
              ...value,
              // Remove sensitive info from stack traces
              stacktrace: {
                ...value.stacktrace,
                frames: value.stacktrace?.frames?.map((frame) => ({
                  ...frame,
                  vars: undefined, // Remove local variables
                })),
              },
            }));
          }

          // Remove PII and sensitive data
          delete event.user;

          return event;
        },
      });
    }
  }

  logPerformanceMetric(metric: Omit<IPerformanceMetric, 'timestamp'>) {
    // Sanitize any sensitive data before logging
    const sanitizedMetric = this.sanitizeMetricData(metric);

    const enrichedMetric: IPerformanceMetric = {
      ...sanitizedMetric,
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
    const sanitizedMetadata = this.sanitizeMetadata(metadata);

    this.logPerformanceMetric({
      type: 'error',
      error,
      metadata: sanitizedMetadata,
      correlationId,
    });

    if (this.environment === 'production') {
      Sentry.withScope((scope) => {
        if (correlationId) {
          scope.setTag('correlationId', correlationId);
        }
        if (sanitizedMetadata) {
          scope.setExtras(sanitizedMetadata);
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

  private sanitizeMetricData(metric: Omit<IPerformanceMetric, 'timestamp'>): Omit<IPerformanceMetric, 'timestamp'> {
    const sanitized = { ...metric };

    if (sanitized.metadata) {
      sanitized.metadata = this.sanitizeMetadata(sanitized.metadata);
    }

    if (sanitized.request?.path) {
      // Remove query parameters from paths
      sanitized.request.path = sanitized.request.path.split('?')[0];
    }

    return sanitized;
  }

  private sanitizeMetadata(metadata?: Record<string, any>): Record<string, any> | undefined {
    if (!metadata) return undefined;

    const sanitized = { ...metadata };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];

    Object.keys(sanitized).forEach((key) => {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        delete sanitized[key];
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeMetadata(sanitized[key]);
      }
    });

    return sanitized;
  }

  private sendToExternalMonitoring(metric: IPerformanceMetric) {
    if (metric.type === 'performance' && metric.duration) {
      // Only log performance metrics that exceed the configured threshold
      if (metric.duration > this.memoryThresholdMs) {
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
}
