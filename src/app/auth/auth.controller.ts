import { Request } from 'express';
import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ITokens } from './interfaces/tokens.interface';
import { RefreshTokensDto } from './dto/refresh-tokens.dto';
import { LoggingService } from '../logging/services/logging.service';
import { LogActionType } from '../logging/entities/log-entry.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loggingService: LoggingService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
  })
  async register(@Body() registerDto: RegisterDto, @Req() req: Request): Promise<ITokens> {
    const startTime = Date.now();
    try {
      const result = await this.authService.register(registerDto);
      const duration = Date.now() - startTime;

      await this.loggingService.logUserAction(
        LogActionType.USER_REGISTRATION,
        `User registration completed: ${registerDto.email}`,
        {
          metadata: { email: registerDto.email },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          correlationId: req['correlationId'],
          performanceMetrics: { duration },
          component: 'auth',
        },
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.loggingService.logError(`User registration failed: ${registerDto.email}`, error, {
        metadata: { email: registerDto.email },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        correlationId: req['correlationId'],
        performanceMetrics: { duration },
        component: 'auth',
      });
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
  })
  async login(@Body() loginDto: LoginDto, @Req() req: Request): Promise<ITokens> {
    const startTime = Date.now();
    try {
      const result = await this.authService.login(loginDto);
      const duration = Date.now() - startTime;

      await this.loggingService.logUserAction(LogActionType.USER_LOGIN, `User login successful: ${loginDto.email}`, {
        metadata: { email: loginDto.email },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        correlationId: req['correlationId'],
        performanceMetrics: { duration },
        component: 'auth',
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.loggingService.logError(`User login failed: ${loginDto.email}`, error, {
        metadata: { email: loginDto.email },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        correlationId: req['correlationId'],
        performanceMetrics: { duration },
        component: 'auth',
      });
      throw error;
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired tokens' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokensDto,
    @Req() req: Request & { user: { id: string; exp: number } },
  ): Promise<ITokens> {
    const startTime = Date.now();
    try {
      // Validate access token expiration
      if (Date.now() >= req.user.exp * 1000) {
        throw new UnauthorizedException('Access token has expired');
      }
      const result = await this.authService.refreshTokens(refreshTokenDto.refreshToken, req.user.id);
      const duration = Date.now() - startTime;

      await this.loggingService.logUserAction(LogActionType.TOKEN_REFRESH, 'Token refresh successful', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        correlationId: req['correlationId'],
        performanceMetrics: { duration },
        component: 'auth',
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.loggingService.logError('Token refresh failed', error, {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        correlationId: req['correlationId'],
        performanceMetrics: { duration },
        component: 'auth',
      });
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user from current session' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body() refreshTokenDto: RefreshTokensDto,
    @Req() req: Request & { user: { id: string } },
  ): Promise<void> {
    const startTime = Date.now();
    try {
      await this.authService.logout(refreshTokenDto.refreshToken);
      const duration = Date.now() - startTime;

      await this.loggingService.logUserAction(LogActionType.USER_LOGOUT, 'User logout successful', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        correlationId: req['correlationId'],
        performanceMetrics: { duration },
        component: 'auth',
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.loggingService.logError('User logout failed', error, {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        correlationId: req['correlationId'],
        performanceMetrics: { duration },
        component: 'auth',
      });
      throw error;
    }
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user from all sessions' })
  @ApiResponse({ status: 200, description: 'Logged out from all sessions' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Req() req: Request & { user: { id: string } }): Promise<void> {
    const startTime = Date.now();
    try {
      await this.authService.logoutAll(req.user.id);
      const duration = Date.now() - startTime;

      await this.loggingService.logUserAction(LogActionType.USER_LOGOUT_ALL, 'User logged out from all devices', {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        correlationId: req['correlationId'],
        performanceMetrics: { duration },
        component: 'auth',
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.loggingService.logError('Failed to logout from all devices', error, {
        userId: req.user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        correlationId: req['correlationId'],
        performanceMetrics: { duration },
        component: 'auth',
      });
      throw error;
    }
  }
}
