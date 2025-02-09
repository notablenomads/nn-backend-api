import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../user/user.service';
import { User } from '../user/entities/user.entity';
import { IJwtPayload, ITokens } from './interfaces/jwt-payload.interface';
import { RegisterDto } from './dto/register.dto';
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
    private readonly cryptoService: CryptoService,
  ) {}

  async register(registerDto: RegisterDto): Promise<ITokens> {
    const user = await this.userService.register(registerDto);
    return this.login(user);
  }

  async validateUser(email: string, password: string): Promise<User> {
    // Generic error message to avoid user enumeration
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

    await this.resetFailedAttempts(email);
    return user;
  }

  async login(user: User): Promise<ITokens> {
    const tokens = await this.generateTokens(user);
    const hashedRefreshToken = await this.cryptoService.generateSecureToken();
    await this.updateRefreshToken(user.id, hashedRefreshToken);
    return tokens;
  }

  async refreshTokens(user: User): Promise<ITokens> {
    const tokens = await this.generateTokens(user);
    const hashedRefreshToken = await this.cryptoService.generateSecureToken();
    await this.updateRefreshToken(user.id, hashedRefreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.updateRefreshToken(userId, null);
  }

  private async generateTokens(user: User): Promise<ITokens> {
    const payload: IJwtPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.secret'),
        expiresIn: this.configService.get<string>('jwt.expiresIn', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('jwt.refreshExpiresIn', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.userService.updateRefreshToken(userId, refreshToken);
  }

  private async handleFailedLogin(email: string): Promise<void> {
    const attempts = this.loginAttempts.get(email) || { count: 0, firstAttempt: Date.now() };

    if (Date.now() - attempts.firstAttempt > LOGIN_ATTEMPT_WINDOW) {
      attempts.count = 1;
      attempts.firstAttempt = Date.now();
    } else {
      attempts.count += 1;
    }

    this.loginAttempts.set(email, attempts);
  }

  private async resetFailedAttempts(email: string): Promise<void> {
    this.loginAttempts.delete(email);
  }

  private async isLoginBlocked(email: string): Promise<boolean> {
    const attempts = this.loginAttempts.get(email);
    if (!attempts) return false;

    if (Date.now() - attempts.firstAttempt > LOGIN_ATTEMPT_WINDOW) {
      this.loginAttempts.delete(email);
      return false;
    }

    return attempts.count >= MAX_LOGIN_ATTEMPTS;
  }
}
