import { Controller, Post, Put, Delete, Body, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { UnauthorizedException } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { AuthGuard } from '../../core/guards/auth.guard';
import { Auth, AuthType } from '../../core/decorators/auth.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { Role } from '../../core/enums/role.enum';

@ApiTags('API Keys')
@Controller('auth/api-keys')
@UseGuards(AuthGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('generate')
  @Auth(AuthType.JWT)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a new API key' })
  async generateApiKey(@Body('description') description?: string) {
    return this.apiKeyService.generateNewApiKey(description);
  }

  @Put('rotate')
  @Auth(AuthType.API_KEY)
  @ApiSecurity('x-api-key')
  @ApiOperation({ summary: 'Rotate the current API key' })
  async rotateApiKey(@Headers('x-api-key') apiKey: string) {
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }
    return this.apiKeyService.rotateApiKey(apiKey);
  }

  @Delete()
  @Auth(AuthType.JWT)
  @Roles(Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate an API key (Super Admin only)' })
  async deactivateApiKey(@Body('apiKey') apiKey: string) {
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }
    await this.apiKeyService.deactivateApiKey(apiKey);
    return { message: 'API key deactivated successfully' };
  }
}
