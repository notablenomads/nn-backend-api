import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogEntry } from './entities/log-entry.entity';
import { LoggingService } from './services/logging.service';
import { LoggingController } from './controllers/logging.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LogEntry])],
  providers: [LoggingService],
  controllers: [LoggingController],
  exports: [LoggingService],
})
export class LoggingModule {}
