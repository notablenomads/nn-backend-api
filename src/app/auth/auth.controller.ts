import { Request } from 'express';
import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokensDto } from './dto/refresh-tokens.dto';
import { LoggingService } from '../logging/services/logging.service';
import { LogLevel, LogActionType } from '../logging/entities/log-entry.entity';
import { IAuthResponse } from './interfaces/auth-response.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly loggingService: LoggingService,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User registered successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User with this email already exists' })
  async register(@Body() registerDto: RegisterDto, @Req() req: Request): Promise<IAuthResponse> {
    try {
      const result = await this.authService.register(registerDto);
      await this.loggingService.log(LogLevel.INFO, 'User registered successfully', LogActionType.USER_REGISTRATION, {
        userId: result.userId,
        ipAddress: req.ip,
        metadata: {
          email: registerDto.email,
        },
      });
      return result;
    } catch (error) {
      await this.loggingService.log(LogLevel.ERROR, 'Registration failed', LogActionType.USER_REGISTRATION_FAILED, {
        ipAddress: req.ip,
        metadata: {
          email: registerDto.email,
          error: error.message,
        },
      });
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User logged in successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request): Promise<IAuthResponse> {
    try {
      const result = await this.authService.login(loginDto);
      await this.loggingService.log(LogLevel.INFO, 'User logged in successfully', LogActionType.USER_LOGIN, {
        userId: result.userId,
        ipAddress: req.ip,
        metadata: {
          email: loginDto.email,
        },
      });
      return result;
    } catch (error) {
      await this.loggingService.log(LogLevel.ERROR, 'Login failed', LogActionType.USER_LOGIN_FAILED, {
        ipAddress: req.ip,
        metadata: {
          email: loginDto.email,
          error: error.message,
        },
      });
      throw error;
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tokens refreshed successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid or expired tokens' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async refreshTokens(
    @Body() refreshTokenDto: RefreshTokensDto,
    @Req() req: Request & { user: { id: string; exp: number } },
  ): Promise<IAuthResponse> {
    try {
      // Validate access token expiration
      if (Date.now() >= req.user.exp * 1000) {
        throw new UnauthorizedException('Access token has expired');
      }

      const result = await this.authService.refreshTokens(refreshTokenDto.refreshToken, req.user.id);
      await this.loggingService.log(LogLevel.INFO, 'Token refresh successful', LogActionType.TOKEN_REFRESH, {
        userId: req.user.id,
        ipAddress: req.ip,
      });
      return result;
    } catch (error) {
      await this.loggingService.log(LogLevel.ERROR, 'Token refresh failed', LogActionType.TOKEN_REFRESH_FAILED, {
        ipAddress: req.ip,
        metadata: {
          error: error.message,
        },
      });
      throw error;
    }
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user from current session' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Logout successful' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body() refreshTokenDto: RefreshTokensDto,
    @Req() req: Request & { user: { id: string } },
  ): Promise<void> {
    try {
      await this.authService.logout(refreshTokenDto.refreshToken);
      await this.loggingService.log(LogLevel.INFO, 'User logged out successfully', LogActionType.USER_LOGOUT, {
        userId: req.user.id,
        ipAddress: req.ip,
      });
    } catch (error) {
      await this.loggingService.log(LogLevel.ERROR, 'User logout failed', LogActionType.USER_LOGOUT_FAILED, {
        ipAddress: req.ip,
        metadata: {
          error: error.message,
        },
      });
      throw error;
    }
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user from all sessions' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Logged out from all sessions' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async logoutAll(@Req() req: Request & { user: { id: string } }): Promise<void> {
    try {
      await this.authService.logoutAll(req.user.id);
      await this.loggingService.log(LogLevel.INFO, 'User logged out from all devices', LogActionType.USER_LOGOUT_ALL, {
        userId: req.user.id,
        ipAddress: req.ip,
      });
    } catch (error) {
      await this.loggingService.log(
        LogLevel.ERROR,
        'Failed to logout from all devices',
        LogActionType.USER_LOGOUT_ALL_FAILED,
        {
          ipAddress: req.ip,
          metadata: {
            error: error.message,
          },
        },
      );
      throw error;
    }
  }
}
