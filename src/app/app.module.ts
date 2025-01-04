import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { HealthModule } from './health/health.module';

const modules = [HealthModule];

@Module({
  imports: [CoreModule, ...modules],
})
export class AppModule {}
