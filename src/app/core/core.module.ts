import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import sentryConfig from '@root/app/config/sentry.config';
import appConfig from '@root/app/config/app.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, sentryConfig],
      envFilePath: ['.env'],
    }),
  ],
})
export class CoreModule {}
