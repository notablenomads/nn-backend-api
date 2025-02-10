import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';
import { ApiKeyGuard } from './api-key.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '../../core/enums/role.enum';

@ApiTags('API Keys')
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a new API key (Admin only)' })
  async generateApiKey(@Body('description') description?: string) {
    return this.apiKeyService.generateNewApiKey(description);
  }

  @Post('rotate')
  @UseGuards(ApiKeyGuard)
  @ApiSecurity('api-key')
  @ApiOperation({ summary: 'Rotate the current API key' })
  async rotateApiKey(@Headers('authorization') authHeader: string) {
    const apiKey = authHeader.split(' ')[1];
    return this.apiKeyService.rotateApiKey(apiKey);
  }

  @Post('deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate an API key (Admin only)' })
  async deactivateApiKey(@Headers('authorization') authHeader: string) {
    const apiKey = authHeader.split(' ')[1];
    return this.apiKeyService.deactivateApiKey(apiKey);
  }
}
