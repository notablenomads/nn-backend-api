import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { IDatabaseConfig } from '../config/config.interface';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get<IDatabaseConfig>('database');
        const nodeEnv = configService.get('app.nodeEnv');
        const isProd = nodeEnv === 'production';

        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          schema: dbConfig.schema,
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          // Disable synchronization in production
          synchronize: false,
          // Enable migrations
          migrationsRun: true,
          migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
          // Enable logging only in non-production environments
          logging: !isProd,
          // Add SSL configuration for production
          ssl: isProd ? { rejectUnauthorized: false } : false,
          // Add connection pool configuration
          poolSize: isProd ? 20 : 10,
          // Add retry configuration
          retryAttempts: 3,
          retryDelay: 3000,
          // Add timeout configuration
          connectTimeoutMS: 10000,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
