import checkDiskSpace from 'check-disk-space';
import { Injectable } from '@nestjs/common';
import { HealthIndicatorService, HealthIndicatorResult } from '@nestjs/terminus';

@Injectable()
export class DiskHealth {
  constructor(private health: HealthIndicatorService) {}

  async isHealthy(): Promise<HealthIndicatorResult> {
    try {
      const diskSpace = await checkDiskSpace('/');
      const usedPercentage = (diskSpace.size - diskSpace.free) / diskSpace.size;
      const isHealthy = usedPercentage <= 0.9; // 90% threshold

      return {
        disk: {
          status: isHealthy ? 'up' : 'down',
        },
      };
    } catch {
      return {
        disk: {
          status: 'down',
        },
      };
    }
  }
}
