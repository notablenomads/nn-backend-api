import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ITokens } from './interfaces/tokens.interface';
import { RefreshTokenService } from './services/refresh-token.service';
import { CryptoService } from '../core/services/crypto.service';

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes in milliseconds

@Injectable()
export class AuthService {
  private loginAttempts: Map<string, { count: number; firstAttempt: number }> = new Map();

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly cryptoService: CryptoService,
  ) {}

  async register(registerDto: RegisterDto, req: Request): Promise<ITokens> {
    const user = await this.userService.register(registerDto);
    return this.generateTokens(user, req);
  }

  async login(loginDto: LoginDto, req: Request): Promise<ITokens> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    await this.resetFailedAttempts(loginDto.email);
    return this.generateTokens(user, req);
  }

  async validateUser(email: string, password: string): Promise<User> {
    const errorMessage = 'Invalid email or password';
    if (await this.isLoginBlocked(email)) {
      throw new UnauthorizedException('Too many failed attempts. Please try again later.');
    }

    const user = await this.userService.findByEmail(email);
    if (!user) {
      await this.handleFailedLogin(email);
      throw new UnauthorizedException(errorMessage);
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(email);
      throw new UnauthorizedException(errorMessage);
    }

    return user;
  }

  async refreshTokens(refreshToken: string, req: Request): Promise<ITokens> {
    const validToken = await this.refreshTokenService.validateToken(refreshToken);
    if (!validToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newRefreshToken = await this.refreshTokenService.replaceToken(refreshToken, validToken.user.id, req);
    const accessToken = this.generateAccessToken(validToken.user as User);

    return {
      accessToken,
      refreshToken: newRefreshToken.token,
    };
  }

  async logout(refreshToken: string, req: Request): Promise<void> {
    await this.refreshTokenService.revokeToken(refreshToken, req.ip);
  }

  async logoutAll(userId: string, req: Request): Promise<void> {
    await this.refreshTokenService.revokeAllUserTokens(userId, req.ip);
  }

  private async generateTokens(user: User, req: Request): Promise<ITokens> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.refreshTokenService.createRefreshToken(user.id, req);

    return {
      accessToken,
      refreshToken: refreshToken.token,
    };
  }

  private generateAccessToken(user: User): string {
    const payload = { sub: user.id, email: user.email, roles: user.roles };
    return this.jwtService.sign(payload);
  }

  private async handleFailedLogin(email: string): Promise<void> {
    const attempt = this.loginAttempts.get(email) || { count: 0, firstAttempt: Date.now() };
    attempt.count++;
    if (!attempt.firstAttempt) {
      attempt.firstAttempt = Date.now();
    }
    this.loginAttempts.set(email, attempt);
  }

  private async resetFailedAttempts(email: string): Promise<void> {
    this.loginAttempts.delete(email);
  }

  private async isLoginBlocked(email: string): Promise<boolean> {
    const attempt = this.loginAttempts.get(email);
    if (!attempt) return false;

    const isWithinWindow = Date.now() - attempt.firstAttempt < LOGIN_ATTEMPT_WINDOW;
    if (!isWithinWindow) {
      this.loginAttempts.delete(email);
      return false;
    }

    return attempt.count >= MAX_LOGIN_ATTEMPTS;
  }
}
