import { Repository, LessThan, MoreThan } from 'typeorm';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { RefreshToken } from '../entities/refresh-token.entity';
import { CryptoService } from '../../core/services/crypto.service';
import { CreateRefreshTokenDto, RefreshTokenResponseDto } from '../dto/refresh-token.dto';

@Injectable()
export class RefreshTokenService {
  private readonly MAX_ACTIVE_SESSIONS = 5;
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
  ) {}

  async createRefreshToken(userId: string): Promise<RefreshTokenResponseDto> {
    const activeTokensCount = await this.countActiveTokens(userId);

    if (activeTokensCount >= this.MAX_ACTIVE_SESSIONS) {
      await this.removeOldestToken(userId);
    }

    const plainToken = this.cryptoService.generateSecureToken();
    const { encryptedData, iv, authTag } = this.cryptoService.encryptToken(plainToken);

    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    const expiresAt = new Date(Date.now() + this.parseDuration(expiresIn));

    const tokenData: CreateRefreshTokenDto = {
      token: encryptedData,
      iv,
      authTag,
      userId,
      expiresAt,
      isValid: true,
      wasUsed: false, // Initialize wasUsed to false
    };

    const savedToken = await this.refreshTokenRepository.save(this.refreshTokenRepository.create(tokenData));

    return {
      id: savedToken.id,
      token: plainToken, // Return plain token in response
      expiresAt: savedToken.expiresAt,
      isValid: savedToken.isValid,
      userId: savedToken.userId,
    };
  }

  async revokeToken(token: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findOne({ where: { token, isValid: true } });

    if (refreshToken) {
      refreshToken.isValid = false;
      await this.refreshTokenRepository.save(refreshToken);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: { userId, isValid: true },
    });

    for (const token of tokens) {
      token.isValid = false;
    }

    await this.refreshTokenRepository.save(tokens);
  }

  async replaceToken(oldToken: string, userId: string): Promise<RefreshTokenResponseDto> {
    const newToken = await this.createRefreshToken(userId);

    const oldRefreshToken = await this.refreshTokenRepository.findOne({
      where: { token: oldToken, isValid: true },
    });

    if (oldRefreshToken) {
      oldRefreshToken.isValid = false;
      await this.refreshTokenRepository.save(oldRefreshToken);
    }

    return newToken;
  }

  async validateToken(plainToken: string): Promise<RefreshToken | null> {
    // Find all valid tokens first
    const tokens = await this.refreshTokenRepository.find({
      where: {
        isValid: true,
        expiresAt: MoreThan(new Date()),
      },
    });

    // Try to find a matching token by decrypting and comparing
    for (const token of tokens) {
      try {
        const decryptedToken = this.cryptoService.decryptToken(token.token, token.iv, token.authTag);

        if (decryptedToken === plainToken) {
          // Token reuse detection - if token was already used, revoke all tokens for the user
          if (token.wasUsed) {
            this.logger.warn(`Refresh token reuse detected for user ${token.userId}`);
            await this.revokeAllUserTokens(token.userId);
            throw new UnauthorizedException('Token reuse detected. All sessions have been invalidated.');
          }

          // Mark token as used
          token.wasUsed = true;
          await this.refreshTokenRepository.save(token);

          return { ...token, userId: token.userId };
        }
      } catch (error) {
        this.logger.error(`Error decrypting token: ${error.message}`);
        continue;
      }
    }

    return null;
  }

  async cleanupExpiredTokens(): Promise<void> {
    try {
      await this.refreshTokenRepository.delete({
        expiresAt: LessThan(new Date()),
      });
    } catch (error) {
      this.logger.error('Failed to cleanup expired tokens:', error);
      throw new Error('Token cleanup failed');
    }
  }

  private async countActiveTokens(userId: string): Promise<number> {
    return this.refreshTokenRepository.count({
      where: {
        userId,
        isValid: true,
        expiresAt: MoreThan(new Date()),
      },
    });
  }

  private async removeOldestToken(userId: string): Promise<void> {
    const oldestToken = await this.refreshTokenRepository.findOne({
      where: {
        userId,
        isValid: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    if (oldestToken) {
      oldestToken.isValid = false;
      await this.refreshTokenRepository.save(oldestToken);
    }
  }

  private parseDuration(duration: string): number {
    const unit = duration.slice(-1);
    const value = parseInt(duration.slice(0, -1));

    switch (unit) {
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'm':
        return value * 60 * 1000;
      case 's':
        return value * 1000;
      default:
        return value;
    }
  }
}
