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
import { LoggingService } from '../logging/services/logging.service';
import { LogActionType, LogLevel } from '../logging/entities/log-entry.entity';

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
    private readonly loggingService: LoggingService,
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
      await this.loggingService.log(LogLevel.INFO, 'User registered successfully', LogActionType.USER_REGISTRATION, {
        userId: user.id,
      });
      return this.generateTokens(user);
    } catch (error) {
      await this.loggingService.log(LogLevel.ERROR, 'Registration failed', LogActionType.USER_REGISTRATION_FAILED, {
        metadata: {
          email: registerDto.email,
          error: error.message,
        },
      });
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<IAuthResponse> {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);
      await this.resetFailedAttempts(loginDto.email);
      await this.loggingService.log(LogLevel.INFO, 'User logged in successfully', LogActionType.USER_LOGIN, {
        userId: user.id,
      });
      return this.generateTokens(user);
    } catch (error) {
      await this.loggingService.log(LogLevel.ERROR, 'Login failed', LogActionType.USER_LOGIN_FAILED, {
        metadata: {
          email: loginDto.email,
          error: error.message,
        },
      });
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

      await this.loggingService.log(LogLevel.INFO, 'Token refreshed successfully', LogActionType.TOKEN_REFRESH, {
        userId: user.id,
      });

      return this.generateTokens(user);
    } catch (error) {
      await this.loggingService.log(LogLevel.ERROR, 'Token refresh failed', LogActionType.TOKEN_REFRESH_FAILED, {
        metadata: {
          userId: accessTokenUserId,
          error: error.message,
        },
      });
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
      await this.loggingService.log(LogLevel.INFO, 'User logged out successfully', LogActionType.USER_LOGOUT, {
        userId: validToken.userId,
      });
    } catch (error) {
      await this.loggingService.log(LogLevel.ERROR, 'Logout failed', LogActionType.USER_LOGOUT_FAILED, {
        metadata: {
          refreshToken,
          error: error.message,
        },
      });
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
      await this.loggingService.log(
        LogLevel.INFO,
        'All sessions logged out successfully',
        LogActionType.USER_LOGOUT_ALL,
        { userId },
      );
    } catch (error) {
      await this.loggingService.log(
        LogLevel.ERROR,
        'Logout all sessions failed',
        LogActionType.USER_LOGOUT_ALL_FAILED,
        {
          metadata: {
            userId,
            error: error.message,
          },
        },
      );
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
