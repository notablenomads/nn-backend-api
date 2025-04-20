import * as Sentry from '@sentry/node';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MAX_SANITIZATION_DEPTH = 3; // Prevent deep recursion
const MAX_OBJECT_SIZE = 10000; // Limit object size to prevent memory issues

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
  private readonly allowedMetadataFields: Set<string>;
  private errorRateLimit = new Map<string, number>();
  private readonly ERROR_RATE_WINDOW = 60000; // 1 minute
  private readonly MAX_ERRORS_PER_WINDOW = 50;

  constructor(private readonly configService: ConfigService) {
    this.environment = this.configService.get<string>('app.nodeEnv', 'development');
    this.memoryThresholdMs = this.configService.get<number>('monitoring.memoryThresholdMs', 1000);
    // Define allowed metadata fields (whitelist approach)
    this.allowedMetadataFields = new Set([
      'userId',
      'requestId',
      'path',
      'method',
      'statusCode',
      'duration',
      'service',
      'feature',
      'version',
    ]);
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
          try {
            // Always sanitize sensitive data regardless of environment
            if (event.request) {
              // Remove sensitive headers
              const sanitizedHeaders = { ...event.request.headers };
              ['authorization', 'cookie'].forEach((header) => delete sanitizedHeaders[header]);
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
          } catch (error) {
            // If sanitization fails, log the error and return a safe version of the event
            this.logger.error('Error sanitizing Sentry event:', error);
            return {
              ...event,
              message: 'Error details sanitized due to processing error',
              extra: {},
              request: {},
            };
          }
        },
      });
    }
  }

  logPerformanceMetric(metric: Omit<IPerformanceMetric, 'timestamp'>) {
    try {
      // Check object size before processing
      if (JSON.stringify(metric).length > MAX_OBJECT_SIZE) {
        this.logger.warn('Metric object too large, truncating...');
        metric = this.truncateObject(metric);
      }

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
    } catch (error) {
      this.logger.error('Error processing performance metric:', error);
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
    const errorKey = `${error.name}:${error.message}`;
    const recentErrors = this.errorRateLimit.get(errorKey) || 0;

    if (recentErrors >= this.MAX_ERRORS_PER_WINDOW) {
      this.logger.warn(`Error rate limit exceeded for: ${errorKey}`);
      return;
    }

    this.errorRateLimit.set(errorKey, recentErrors + 1);
    setTimeout(
      () => this.errorRateLimit.set(errorKey, (this.errorRateLimit.get(errorKey) || 1) - 1),
      this.ERROR_RATE_WINDOW,
    );

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
    try {
      const sanitized = { ...metric };

      if (sanitized.metadata) {
        sanitized.metadata = this.sanitizeMetadata(sanitized.metadata, 0);
      }

      if (sanitized.request?.path) {
        // Remove query parameters from paths
        sanitized.request.path = sanitized.request.path.split('?')[0];
      }

      return sanitized;
    } catch (error) {
      this.logger.error('Error sanitizing metric data:', error);
      return {
        type: metric.type,
        className: metric.className,
        methodName: metric.methodName,
      };
    }
  }

  private sanitizeMetadata(metadata?: Record<string, any>, depth: number = 0): Record<string, any> | undefined {
    try {
      if (!metadata || depth >= MAX_SANITIZATION_DEPTH) return undefined;

      const sanitized: Record<string, any> = {};

      // Use whitelist approach - only copy allowed fields
      Object.keys(metadata).forEach((key) => {
        if (this.allowedMetadataFields.has(key)) {
          const value = metadata[key];
          if (value === null || value === undefined) {
            return;
          }

          if (typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = this.sanitizeMetadata(value, depth + 1);
          } else {
            sanitized[key] = value;
          }
        }
      });

      return sanitized;
    } catch (error) {
      this.logger.error('Error sanitizing metadata:', error);
      return undefined;
    }
  }

  private truncateObject(obj: any, maxDepth: number = 2): any {
    if (maxDepth <= 0) return '[Truncated]';

    if (Array.isArray(obj)) {
      return obj
        .slice(0, 10)
        .map((item) => (typeof item === 'object' ? this.truncateObject(item, maxDepth - 1) : item));
    }

    if (typeof obj === 'object' && obj !== null) {
      const truncated: Record<string, any> = {};
      Object.keys(obj)
        .slice(0, 20)
        .forEach((key) => {
          truncated[key] = typeof obj[key] === 'object' ? this.truncateObject(obj[key], maxDepth - 1) : obj[key];
        });
      return truncated;
    }

    return obj;
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
