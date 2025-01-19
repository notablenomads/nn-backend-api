import { Request } from 'express';
import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConnectionSecurityService } from './connection-security.service';
import { ISecurityCheckResult } from './interfaces/security-check.interface';

@ApiTags('Connection Security')
@Controller('security')
export class ConnectionSecurityController {
  constructor(private readonly securityService: ConnectionSecurityService) {}

  @Get('check')
  @ApiOperation({ summary: 'Check connection security' })
  @ApiResponse({
    status: 200,
    description: 'Returns detailed information about connection security',
    type: 'object',
  })
  async checkSecurity(@Req() req: Request): Promise<ISecurityCheckResult> {
    return this.securityService.checkSecurity(req);
  }
}
