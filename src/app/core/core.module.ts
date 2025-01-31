import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CorsService } from './services/cors.service';
import { validationSchema } from '../config/env.validation';
import configuration from '../config/configuration';
import { PackageInfoService } from './services/package-info.service';
import { DatabaseModule } from '../database/database.module';

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
    DatabaseModule,
  ],
  providers: [CorsService, PackageInfoService],
  exports: [CorsService, PackageInfoService],
})
export class CoreModule {}
