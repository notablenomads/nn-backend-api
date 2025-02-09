import { Repository, LessThan } from 'typeorm';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from '../entities/refresh-token.entity';
import { CryptoService } from '../../core/services/crypto.service';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService,
    private readonly cryptoService: CryptoService,
  ) {}

  async createRefreshToken(userId: string, req: Request): Promise<RefreshToken> {
    const token = this.cryptoService.generateSecureToken();
    const expiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    const expiresAt = new Date(Date.now() + this.parseDuration(expiresIn));

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      userAgent: req.get('user-agent'),
      ipAddress: req.ip,
    });

    return this.refreshTokenRepository.save(refreshToken);
  }

  async revokeToken(token: string, ipAddress: string): Promise<void> {
    const refreshToken = await this.refreshTokenRepository.findOne({ where: { token, isValid: true } });

    if (refreshToken) {
      refreshToken.isValid = false;
      refreshToken.revokedAt = new Date();
      refreshToken.revokedByIp = ipAddress;
      await this.refreshTokenRepository.save(refreshToken);
    }
  }

  async revokeAllUserTokens(userId: string, ipAddress: string): Promise<void> {
    const tokens = await this.refreshTokenRepository.find({
      where: { userId, isValid: true },
    });

    for (const token of tokens) {
      token.isValid = false;
      token.revokedAt = new Date();
      token.revokedByIp = ipAddress;
    }

    await this.refreshTokenRepository.save(tokens);
  }

  async replaceToken(oldToken: string, userId: string, req: Request): Promise<RefreshToken> {
    const newToken = await this.createRefreshToken(userId, req);

    const oldRefreshToken = await this.refreshTokenRepository.findOne({
      where: { token: oldToken, isValid: true },
    });

    if (oldRefreshToken) {
      oldRefreshToken.isValid = false;
      oldRefreshToken.revokedAt = new Date();
      oldRefreshToken.revokedByIp = req.ip;
      oldRefreshToken.replacedByToken = newToken.token;
      await this.refreshTokenRepository.save(oldRefreshToken);
    }

    return newToken;
  }

  async validateToken(token: string): Promise<RefreshToken | null> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token, isValid: true },
      relations: ['user'],
    });

    if (!refreshToken || !refreshToken.isValid || refreshToken.expiresAt < new Date()) {
      return null;
    }

    return refreshToken;
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });
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
