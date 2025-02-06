import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CorsService } from './services/cors.service';
import { validationSchema } from '../config/env.validation';
import configuration from '../config/configuration';
import { PackageInfoService } from './services/package-info.service';
import { DatabaseModule } from '../database/database.module';
import { CustomThrottlerGuard } from './guards/throttler.guard';

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
        ttl: 60, // Time-to-live - the time window in seconds
        limit: 10, // The maximum number of requests within the TTL
      },
    ]),
    DatabaseModule,
  ],
  providers: [CorsService, PackageInfoService, CustomThrottlerGuard],
  exports: [CorsService, PackageInfoService, ThrottlerModule, CustomThrottlerGuard],
})
export class CoreModule {}
