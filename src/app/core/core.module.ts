import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import sentryConfig from '@root/app/config/sentry.config';
import appConfig from '@root/app/config/app.config';
import dbConfig from '@root/app/config/db.config';
import { TypeOrmConfigService } from './database/typeorm-config.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, dbConfig, sentryConfig],
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeOrmConfigService,
    }),
  ],
})
export class CoreModule {}
