import { Request } from 'express';
import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokensDto } from './dto/refresh-tokens.dto';
import { IAuthResponse } from './interfaces/auth-response.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User registered successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'User with this email already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<IAuthResponse> {
    try {
      const result = await this.authService.register(registerDto);
      return result;
    } catch (error) {
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User logged in successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<IAuthResponse> {
    try {
      const result = await this.authService.login(loginDto);
      return result;
    } catch (error) {
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
      return result;
    } catch (error) {
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
  async logout(@Body() refreshTokenDto: RefreshTokensDto): Promise<void> {
    try {
      await this.authService.logout(refreshTokenDto.refreshToken);
    } catch (error) {
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
    } catch (error) {
      throw error;
    }
  }
}
