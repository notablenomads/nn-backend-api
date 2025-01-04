import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { HealthModule } from './health/health.module';
import { AppController } from './app.controller';

const modules = [HealthModule];

@Module({
  imports: [CoreModule, ...modules],
  controllers: [AppController],
})
export class AppModule {}
