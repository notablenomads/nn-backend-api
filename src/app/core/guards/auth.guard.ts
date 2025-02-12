import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthType, AUTH_TYPE_KEY } from '../decorators/auth.decorator';
import { ApiKeyService } from '../../auth/api-key/api-key.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authType = this.reflector.get<AuthType>(AUTH_TYPE_KEY, context.getHandler()) || AuthType.NONE;

    // If no auth is required, allow access
    if (authType === AuthType.NONE) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const apiKey = request.headers['x-api-key'];

    try {
      switch (authType) {
        case AuthType.JWT:
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Invalid JWT format');
          }
          const token = authHeader.split(' ')[1];
          const payload = await this.jwtService.verifyAsync(token);
          request.user = payload;
          return true;

        case AuthType.API_KEY:
          if (!apiKey) {
            throw new UnauthorizedException('API key is required');
          }
          const isValidApiKey = await this.apiKeyService.validateApiKey(apiKey);
          if (!isValidApiKey) {
            throw new UnauthorizedException('Invalid API key');
          }
          return true;

        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      throw new UnauthorizedException('Authentication failed');
    }
  }
}
