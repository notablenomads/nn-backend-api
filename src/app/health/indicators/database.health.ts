import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TypeOrmHealthIndicator, HealthIndicatorService } from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class DatabaseHealthIndicator extends TypeOrmHealthIndicator {
  constructor(
    moduleRef: ModuleRef,
    healthIndicatorService: HealthIndicatorService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {
    super(moduleRef, healthIndicatorService);
  }

  async isHealthy() {
    return this.pingCheck('database', { connection: this.dataSource });
  }
}
