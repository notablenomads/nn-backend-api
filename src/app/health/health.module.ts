import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { DiskHealth } from './indicators/disk.health';
import { MemoryHealth } from './indicators/memory.health';

@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
      gracefulShutdownTimeoutMs: 1000,
    }),
    HttpModule,
  ],
  controllers: [HealthController],
  providers: [DatabaseHealthIndicator, DiskHealth, MemoryHealth],
})
export class HealthModule {}
