import * as process from 'process';
import { Injectable } from '@nestjs/common';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class MemoryHealth {
  constructor(private health: HealthIndicatorService) {}

  async isHealthy(): Promise<HealthIndicatorResult> {
    const heap = process.memoryUsage().heapUsed;
    const rss = process.memoryUsage().rss;

    const heapLimit = 150 * 1024 * 1024; // 150MB
    const rssLimit = 300 * 1024 * 1024; // 300MB

    const isHeapHealthy = heap <= heapLimit;
    const isRssHealthy = rss <= rssLimit;

    return {
      memory: {
        status: isHeapHealthy && isRssHealthy ? 'up' : 'down',
      },
    };
  }
}
