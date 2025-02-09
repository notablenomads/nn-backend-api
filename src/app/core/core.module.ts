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
        ttl: 60,
        limit: 30, // Default limit
      },
      {
        ttl: 60,
        limit: 5,
        name: 'auth', // For authentication routes
      },
      {
        ttl: 60,
        limit: 10,
        name: 'email', // For email-related routes
      },
      {
        ttl: 60,
        limit: 20,
        name: 'api', // For general API routes
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
