import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { LoggingService } from '../services/logging.service';
import { LogLevel, LogActionType } from '../entities/log-entry.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Auth, AuthType } from '../../core/decorators/auth.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '../../core/enums/role.enum';
import { GetLogsDto } from '../dto/get-logs.dto';

@ApiTags('logging')
@Controller('logs')
@UseGuards(JwtAuthGuard)
@Auth(AuthType.JWT)
@Roles(Role.SUPER_ADMIN)
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
  async getLogs(@Query() query: GetLogsDto) {
    return this.loggingService.getLogs({
      ...query,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });
  }
}
