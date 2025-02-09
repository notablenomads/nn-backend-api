import { DataSource } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { MonitoringService } from '../core/services/monitoring.service';

export interface IHealthCheck {
  status: 'up' | 'down';
  details?: Record<string, any>;
  error?: string;
}

export interface ISystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  environment: string;
  version: string;
  checks: {
    database: IHealthCheck;
    memory: IHealthCheck;
    uptime: IHealthCheck;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly monitoringService: MonitoringService,
  ) {}

  async checkHealth(): Promise<ISystemHealth> {
    const [dbHealth, memoryHealth, uptimeHealth] = await Promise.all([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkUptime(),
    ]);

    const systemHealth: ISystemHealth = {
      status: this.determineOverallStatus([dbHealth, memoryHealth, uptimeHealth]),
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('app.nodeEnv', 'development'),
      version: this.configService.get<string>('app.version', '1.0.0'),
      checks: {
        database: dbHealth,
        memory: memoryHealth,
        uptime: uptimeHealth,
      },
    };

    // Log health check results
    this.monitoringService.logPerformanceMetric({
      type: 'request',
      request: {
        method: 'GET',
        path: '/health',
        statusCode: 200,
        duration: 0,
      },
      metadata: systemHealth,
    });

    return systemHealth;
  }

  private async checkDatabase(): Promise<IHealthCheck> {
    try {
      if (!this.dataSource.isInitialized) {
        throw new Error('Database connection is not established');
      }

      await this.dataSource.query('SELECT 1');

      return {
        status: 'up',
        details: {
          type: this.dataSource.options.type,
          database: this.dataSource.options.database,
        },
      };
    } catch (error) {
      this.logger.error(`Database health check failed: ${error.message}`);
      return {
        status: 'down',
        error: error.message,
      };
    }
  }

  private async checkMemory(): Promise<IHealthCheck> {
    try {
      const memoryUsage = process.memoryUsage();
      const memoryThresholdMB = 1024; // 1GB
      const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
      const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
      const status = heapUsedMB < memoryThresholdMB ? 'up' : 'down';

      return {
        status,
        details: {
          heapUsed: `${heapUsedMB}MB`,
          heapTotal: `${heapTotalMB}MB`,
          percentage: `${Math.round((heapUsedMB / heapTotalMB) * 100)}%`,
        },
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
      };
    }
  }

  private async checkUptime(): Promise<IHealthCheck> {
    try {
      const uptimeSeconds = process.uptime();
      const uptimeHours = Math.floor(uptimeSeconds / 3600);

      return {
        status: 'up',
        details: {
          uptime: `${uptimeHours} hours`,
          uptimeSeconds: Math.round(uptimeSeconds),
        },
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
      };
    }
  }

  private determineOverallStatus(checks: IHealthCheck[]): ISystemHealth['status'] {
    const hasDownChecks = checks.some((check) => check.status === 'down');
    if (hasDownChecks) {
      return 'unhealthy';
    }

    const allChecksUp = checks.every((check) => check.status === 'up');
    return allChecksUp ? 'healthy' : 'degraded';
  }
}
