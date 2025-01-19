import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CorsService } from './services/cors.service';
import { validationSchema } from '../config/env.validation';
import configuration from '../config/configuration';

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
  ],
  providers: [CorsService],
  exports: [CorsService],
})
export class CoreModule {}
