import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IAuthResponse } from './interfaces/auth-response.interface';
import { RefreshTokenService } from './services/refresh-token.service';
import { CryptoService } from '../core/services/crypto.service';
import { TokenBlacklistService } from './services/token-blacklist.service';

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
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  private async generateTokens(user: User): Promise<IAuthResponse> {
    const payload = { sub: user.id, email: user.email };
    const [accessToken, refreshTokenResponse] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.refreshTokenService.createRefreshToken(user.id),
    ]);

    return {
      accessToken,
      refreshToken: refreshTokenResponse.token,
      userId: user.id,
      email: user.email,
    };
  }

  async register(registerDto: RegisterDto): Promise<IAuthResponse> {
    try {
      const user = await this.userService.register(registerDto);
      return this.generateTokens(user);
    } catch (error) {
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<IAuthResponse> {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);
      await this.resetFailedAttempts(loginDto.email);
      return this.generateTokens(user);
    } catch (error) {
      throw error;
    }
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

    const isPasswordValid = await this.cryptoService.comparePasswords(password, user.password);
    if (!isPasswordValid) {
      await this.handleFailedLogin(email);
      throw new UnauthorizedException(errorMessage);
    }

    return user;
  }

  async refreshTokens(refreshToken: string, accessTokenUserId: string): Promise<IAuthResponse> {
    try {
      if (!refreshToken || typeof refreshToken !== 'string') {
        throw new UnauthorizedException('Missing or invalid refresh token format');
      }

      const validToken = await this.refreshTokenService.validateToken(refreshToken);
      if (!validToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      // Verify that the user from the access token matches the refresh token's user
      if (validToken.userId !== accessTokenUserId) {
        throw new UnauthorizedException('Token mismatch - possible security breach detected');
      }

      const user = await this.userService.findById(validToken.userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw error;
    }
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const validToken = await this.refreshTokenService.validateToken(refreshToken);
      if (!validToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      await this.refreshTokenService.revokeToken(refreshToken);
    } catch (error) {
      throw error;
    }
  }

  async logoutAll(userId: string): Promise<void> {
    try {
      const user = await this.userService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      await this.refreshTokenService.revokeAllUserTokens(userId);
    } catch (error) {
      throw error;
    }
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
