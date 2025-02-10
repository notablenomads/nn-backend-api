import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CorsService } from './services/cors.service';
import { validationSchema } from '../config/env.validation';
import configuration from '../config/configuration';
import { PackageInfoService } from './services/package-info.service';
import { DatabaseModule } from '../database/database.module';
import { CustomThrottlerGuard } from './guards/throttler.guard';
import { MonitoringService } from './services/monitoring.service';
import { PerformanceInterceptor } from './interceptors/performance.interceptor';
import { CryptoService } from './services/crypto.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 5,
        blockDuration: 60000, // Block for 1 minute after exceeding
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 30,
        blockDuration: 300000, // Block for 5 minutes after exceeding
      },
      {
        name: 'auth',
        ttl: 300000, // 5 minutes
        limit: 5,
        blockDuration: 900000, // Block for 15 minutes after exceeding
      },
      {
        name: 'email',
        ttl: 3600000, // 1 hour
        limit: 10,
        blockDuration: 7200000, // Block for 2 hours after exceeding
      },
      {
        name: 'api',
        ttl: 60000, // 1 minute
        limit: 50,
        blockDuration: 300000, // Block for 5 minutes after exceeding
      },
    ]),
    DatabaseModule,
  ],
  providers: [
    CorsService,
    PackageInfoService,
    CustomThrottlerGuard,
    MonitoringService,
    PerformanceInterceptor,
    CryptoService,
  ],
  exports: [
    CorsService,
    PackageInfoService,
    ThrottlerModule,
    CustomThrottlerGuard,
    MonitoringService,
    PerformanceInterceptor,
    CryptoService,
  ],
})
export class CoreModule {}
