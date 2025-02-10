import { Controller, Post, Body, UseGuards, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApiKeyService } from './api-key.service';
import { ApiKeyGuard } from './api-key.guard';

@ApiTags('API Keys')
@Controller('api-keys')
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new API key' })
  async generateApiKey(@Body('description') description?: string) {
    return this.apiKeyService.generateNewApiKey(description);
  }

  @Post('rotate')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rotate the current API key' })
  async rotateApiKey(@Headers('authorization') authHeader: string) {
    const apiKey = authHeader.split(' ')[1];
    return this.apiKeyService.rotateApiKey(apiKey);
  }

  @Post('deactivate')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate the current API key' })
  async deactivateApiKey(@Headers('authorization') authHeader: string) {
    const apiKey = authHeader.split(' ')[1];
    return this.apiKeyService.deactivateApiKey(apiKey);
  }
}
