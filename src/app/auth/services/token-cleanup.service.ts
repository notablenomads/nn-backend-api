import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RefreshTokenService } from './refresh-token.service';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly refreshTokenService: RefreshTokenService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleTokenCleanup() {
    try {
      this.logger.log('Starting expired token cleanup...');
      await this.refreshTokenService.cleanupExpiredTokens();
      this.logger.log('Expired token cleanup completed successfully');
    } catch (error) {
      this.logger.error('Error during token cleanup:', error);
    }
  }
}
