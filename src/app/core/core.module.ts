import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
})
export class CoreModule {}
