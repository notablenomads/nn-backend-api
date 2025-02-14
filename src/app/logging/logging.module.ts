import { Module, Global, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LogEntry } from './entities/log-entry.entity';
import { LoggingService } from './services/logging.service';
import { LoggingController } from './controllers/logging.controller';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([LogEntry])],
  providers: [
    LoggingService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
  controllers: [LoggingController],
  exports: [LoggingService],
})
export class LoggingModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
