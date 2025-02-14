import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LogEntry, LogLevel, LogActionType } from '../entities/log-entry.entity';

export interface ILogOptions {
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  stackTrace?: string;
  requestId?: string;
  correlationId?: string;
  ipAddress?: string;
  userAgent?: string;
  environment?: string;
  component?: string;
  version?: string;
  performanceMetrics?: {
    duration?: number;
    memoryUsage?: number;
    cpuUsage?: number;
  };
  request?: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: any;
  };
  response?: {
    statusCode?: number;
    headers?: Record<string, string>;
    body?: any;
  };
}

@Injectable()
export class LoggingService {
  private environment: string;

  constructor(
    @InjectRepository(LogEntry)
    private readonly logRepository: Repository<LogEntry>,
  ) {
    this.environment = process.env.NODE_ENV || 'development';
  }

  async log(level: LogLevel, message: string, actionType?: LogActionType, options?: ILogOptions): Promise<LogEntry> {
    const logEntry = await this.logRepository.create({
      level,
      message,
      actionType,
      userId: options?.userId,
      sessionId: options?.sessionId,
      requestId: options?.requestId,
      correlationId: options?.correlationId,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      environment: options?.environment || this.environment,
      component: options?.component,
      version: options?.version,
      metadata: options?.metadata,
      stackTrace: options?.stackTrace,
      performanceMetrics: options?.performanceMetrics,
      request: options?.request,
      response: options?.response,
    });

    return this.logRepository.save(logEntry);
  }

  async logUserAction(actionType: LogActionType, message: string, options?: ILogOptions): Promise<LogEntry> {
    return this.log(LogLevel.INFO, message, actionType, options);
  }

  async logError(message: string, error: Error, options?: ILogOptions): Promise<LogEntry> {
    return this.log(LogLevel.ERROR, message, undefined, {
      ...options,
      stackTrace: error.stack,
      metadata: {
        ...options?.metadata,
        errorName: error.name,
        errorMessage: error.message,
      },
    });
  }

  async getLogs(filters: {
    userId?: string;
    level?: LogLevel;
    actionType?: LogActionType;
    startDate?: Date;
    endDate?: Date;
    component?: string;
    environment?: string;
    requestId?: string;
    correlationId?: string;
    page?: number;
    limit?: number;
  }) {
    const query = this.logRepository.createQueryBuilder('log');

    if (filters.userId) {
      query.andWhere('log.userId = :userId', { userId: filters.userId });
    }

    if (filters.level) {
      query.andWhere('log.level = :level', { level: filters.level });
    }

    if (filters.actionType) {
      query.andWhere('log.actionType = :actionType', { actionType: filters.actionType });
    }

    if (filters.startDate) {
      query.andWhere('log.timestamp >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      query.andWhere('log.timestamp <= :endDate', { endDate: filters.endDate });
    }

    if (filters.component) {
      query.andWhere('log.component = :component', { component: filters.component });
    }

    if (filters.environment) {
      query.andWhere('log.environment = :environment', { environment: filters.environment });
    }

    if (filters.requestId) {
      query.andWhere('log.requestId = :requestId', { requestId: filters.requestId });
    }

    if (filters.correlationId) {
      query.andWhere('log.correlationId = :correlationId', { correlationId: filters.correlationId });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    query.orderBy('log.timestamp', 'DESC').skip(skip).take(limit);

    const [logs, total] = await query.getManyAndCount();

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
