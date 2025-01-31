import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { IDatabaseConfig } from '../config/config.interface';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<IDatabaseConfig>('database');
        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          schema: dbConfig.schema,
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          synchronize: configService.get('app.nodeEnv') !== 'production',
          logging: configService.get('app.nodeEnv') !== 'production',
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
