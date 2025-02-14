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
import { TokenBlacklistService } from './services/token-blacklist.service';
import { LoggingService } from '../logging/services/logging.service';
import { LogActionType } from '../logging/entities/log-entry.entity';

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

  async register(registerDto: RegisterDto): Promise<ITokens> {
    try {
      const user = await this.userService.register(registerDto);
      await this.loggingService.logUserAction(
        LogActionType.USER_REGISTRATION,
        `User registered successfully: ${registerDto.email}`,
        { userId: user.id },
      );
      return this.generateTokens(user);
    } catch (error) {
      await this.loggingService.logError(`Failed to register user: ${registerDto.email}`, error, {
        metadata: { email: registerDto.email },
      });
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<ITokens> {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);
      await this.resetFailedAttempts(loginDto.email);
      await this.loggingService.logUserAction(
        LogActionType.USER_LOGIN,
        `User logged in successfully: ${loginDto.email}`,
        { userId: user.id },
      );
      return this.generateTokens(user);
    } catch (error) {
      await this.loggingService.logError(`Failed login attempt for user: ${loginDto.email}`, error, {
        metadata: { email: loginDto.email },
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

  async refreshTokens(refreshToken: string, accessTokenUserId: string): Promise<ITokens> {
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

      await this.loggingService.logUserAction(LogActionType.TOKEN_REFRESH, `Token refreshed for user: ${user.email}`, {
        userId: user.id,
      });

      return this.generateTokens(user);
    } catch (error) {
      await this.loggingService.logError(`Failed to refresh tokens for user ID: ${accessTokenUserId}`, error, {
        userId: accessTokenUserId,
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
      await this.loggingService.logUserAction(LogActionType.USER_LOGOUT, `User logged out successfully`, {
        userId: validToken.userId,
      });
    } catch (error) {
      await this.loggingService.logError('Failed to logout user', error, { metadata: { refreshToken } });
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
      await this.loggingService.logUserAction(
        LogActionType.USER_LOGOUT_ALL,
        `All sessions logged out for user: ${user.email}`,
        { userId },
      );
    } catch (error) {
      await this.loggingService.logError('Failed to logout all sessions', error, { userId });
      throw error;
    }
  }

  private async generateTokens(user: User): Promise<ITokens> {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.refreshTokenService.createRefreshToken(user.id);

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
