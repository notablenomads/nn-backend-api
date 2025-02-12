import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const apiKey = this.extractApiKey(request);

      if (!apiKey) {
        throw new UnauthorizedException('API key is required');
      }

      const isValid = await this.apiKeyService.validateApiKey(apiKey);

      if (!isValid) {
        throw new UnauthorizedException('Invalid or expired API key');
      }

      return true;
    } catch (error) {
      this.logger.error('API key validation failed', { error: error.message });
      throw error;
    }
  }

  private extractApiKey(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('ApiKey ')) {
      return undefined;
    }
    return authHeader.split(' ')[1];
  }
}
