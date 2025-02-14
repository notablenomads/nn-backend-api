import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LoggingService } from '../services/logging.service';
import { LogLevel, LogActionType } from '../entities/log-entry.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@ApiTags('logging')
@Controller('logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LoggingController {
  constructor(private readonly loggingService: LoggingService) {}

  @Get()
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'level', enum: LogLevel, required: false })
  @ApiQuery({ name: 'actionType', enum: LogActionType, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getLogs(
    @Query('userId') userId?: string,
    @Query('level') level?: LogLevel,
    @Query('actionType') actionType?: LogActionType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.loggingService.getLogs({
      userId,
      level,
      actionType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page.toString(), 10) : undefined,
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
    });
  }
}
