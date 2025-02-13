import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HttpHealthIndicator, HealthCheck } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { DiskHealth } from './indicators/disk.health';
import { MemoryHealth } from './indicators/memory.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: DatabaseHealthIndicator,
    private disk: DiskHealth,
    private memory: MemoryHealth,
  ) {}

  @Get()
  @HealthCheck()
  checkAll() {
    return this.health.check([
      () => this.http.pingCheck('google', 'https://www.google.com'),
      () => this.db.isHealthy(),
      () => this.disk.isHealthy(),
      () => this.memory.isHealthy(),
    ]);
  }

  @Get('http')
  @HealthCheck()
  checkHttp() {
    return this.health.check([() => this.http.pingCheck('google', 'https://www.google.com')]);
  }

  @Get('db')
  @HealthCheck()
  checkDatabase() {
    return this.health.check([() => this.db.isHealthy()]);
  }

  @Get('disk')
  @HealthCheck()
  checkDisk() {
    return this.health.check([() => this.disk.isHealthy()]);
  }

  @Get('memory')
  @HealthCheck()
  checkMemory() {
    return this.health.check([() => this.memory.isHealthy()]);
  }
}
