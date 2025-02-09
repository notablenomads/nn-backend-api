import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);
  private readonly blacklist: Set<string> = new Set();
  private readonly tokenExpirations: Map<string, number> = new Map();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Add a token to the blacklist
   * @param token The token to blacklist
   * @param expirationTime Unix timestamp when the token expires
   */
  async blacklistToken(token: string, expirationTime: number): Promise<void> {
    this.blacklist.add(token);
    this.tokenExpirations.set(token, expirationTime);
    this.logger.debug(`Token added to blacklist, expires at: ${new Date(expirationTime).toISOString()}`);
  }

  /**
   * Check if a token is blacklisted
   * @param token The token to check
   * @returns boolean indicating if the token is blacklisted
   */
  async isBlacklisted(token: string): Promise<boolean> {
    return this.blacklist.has(token);
  }

  /**
   * Remove a specific token from the blacklist
   * @param token The token to remove
   */
  async removeFromBlacklist(token: string): Promise<void> {
    this.blacklist.delete(token);
    this.tokenExpirations.delete(token);
  }

  /**
   * Clean up expired tokens from the blacklist
   * Runs every hour by default
   */
  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTokens(): Promise<void> {
    const now = Date.now();
    let removedCount = 0;

    for (const [token, expirationTime] of this.tokenExpirations.entries()) {
      if (expirationTime <= now) {
        this.blacklist.delete(token);
        this.tokenExpirations.delete(token);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.logger.debug(`Cleaned up ${removedCount} expired tokens from blacklist`);
    }
  }

  /**
   * Get the current size of the blacklist
   * @returns The number of blacklisted tokens
   */
  getBlacklistSize(): number {
    return this.blacklist.size;
  }
}
