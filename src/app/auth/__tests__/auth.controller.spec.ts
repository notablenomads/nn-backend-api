import { Request } from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoggingService } from '../../logging/services/logging.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokensDto } from '../dto/refresh-tokens.dto';
import { LogLevel, LogActionType } from '../../logging/entities/log-entry.entity';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
  };

  const mockLoggingService = {
    log: jest.fn(),
  };

  type RequestWithUser = Request & { user?: { id: string; exp?: number } };

  const mockRequest = (ip = '127.0.0.1', userId?: string, exp?: number) => {
    const req = { ip } as RequestWithUser;
    if (userId) {
      req.user = { id: userId };
      if (exp !== undefined) {
        req.user.exp = exp;
      }
    }
    return req as Request & { user: { id: string; exp?: number } };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: LoggingService,
          useValue: mockLoggingService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      userId: '123',
      email: 'test@example.com',
    };

    it('should register user successfully', async () => {
      mockAuthService.register.mockResolvedValue(mockResponse);

      const result = await controller.register(registerDto, mockRequest());

      expect(result).toEqual(mockResponse);
      expect(mockLoggingService.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'User registered successfully',
        LogActionType.USER_REGISTRATION,
        expect.any(Object),
      );
    });

    it('should handle registration errors', async () => {
      const error = new BadRequestException('Registration failed');
      mockAuthService.register.mockRejectedValue(error);

      await expect(controller.register(registerDto, mockRequest())).rejects.toThrow(error);
      expect(mockLoggingService.log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'Registration failed',
        LogActionType.USER_REGISTRATION_FAILED,
        expect.any(Object),
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      userId: '123',
      email: 'test@example.com',
    };

    it('should login user successfully', async () => {
      mockAuthService.login.mockResolvedValue(mockResponse);

      const result = await controller.login(loginDto, mockRequest());

      expect(result).toEqual(mockResponse);
      expect(mockLoggingService.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'User logged in successfully',
        LogActionType.USER_LOGIN,
        expect.any(Object),
      );
    });

    it('should handle login errors', async () => {
      const error = new UnauthorizedException('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto, mockRequest())).rejects.toThrow(error);
      expect(mockLoggingService.log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'Login failed',
        LogActionType.USER_LOGIN_FAILED,
        expect.any(Object),
      );
    });
  });

  describe('refreshTokens', () => {
    const refreshTokenDto: RefreshTokensDto = {
      refreshToken: 'refresh-token',
    };

    it('should refresh tokens successfully', async () => {
      const mockTokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };
      mockAuthService.refreshTokens.mockResolvedValue(mockTokens);
      const req = mockRequest('127.0.0.1', '123', Math.floor(Date.now() / 1000) + 3600) as Request & {
        user: { id: string; exp: number };
      };

      const result = await controller.refreshTokens(refreshTokenDto, req);

      expect(result).toEqual(mockTokens);
      expect(mockAuthService.refreshTokens).toHaveBeenCalledWith(refreshTokenDto.refreshToken, req.user.id);
      expect(mockLoggingService.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Token refresh successful',
        LogActionType.TOKEN_REFRESH,
        expect.any(Object),
      );
    });

    it('should handle refresh token errors', async () => {
      const error = new UnauthorizedException('Invalid refresh token');
      mockAuthService.refreshTokens.mockRejectedValue(error);
      const req = mockRequest('127.0.0.1', '123', Math.floor(Date.now() / 1000) + 3600) as Request & {
        user: { id: string; exp: number };
      };

      await expect(controller.refreshTokens(refreshTokenDto, req)).rejects.toThrow(error);
      expect(mockLoggingService.log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'Token refresh failed',
        LogActionType.TOKEN_REFRESH_FAILED,
        expect.any(Object),
      );
    });
  });

  describe('logout', () => {
    const refreshTokenDto: RefreshTokensDto = {
      refreshToken: 'refresh-token',
    };

    it('should logout successfully', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);
      const req = mockRequest('127.0.0.1', '123') as Request & { user: { id: string } };

      await controller.logout(refreshTokenDto, req);

      expect(mockAuthService.logout).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
      expect(mockLoggingService.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'User logged out successfully',
        LogActionType.USER_LOGOUT,
        expect.any(Object),
      );
    });

    it('should handle logout errors', async () => {
      const error = new UnauthorizedException('Invalid refresh token');
      mockAuthService.logout.mockRejectedValue(error);
      const req = mockRequest('127.0.0.1', '123') as Request & { user: { id: string } };

      await expect(controller.logout(refreshTokenDto, req)).rejects.toThrow(error);
      expect(mockLoggingService.log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'User logout failed',
        LogActionType.USER_LOGOUT_FAILED,
        expect.any(Object),
      );
    });
  });

  describe('logoutAll', () => {
    const mockUserId = '123';

    it('should logout all sessions successfully', async () => {
      mockAuthService.logoutAll.mockResolvedValue(undefined);
      const req = mockRequest('127.0.0.1', mockUserId) as Request & { user: { id: string } };

      await controller.logoutAll(req);

      expect(mockAuthService.logoutAll).toHaveBeenCalledWith(mockUserId);
      expect(mockLoggingService.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'User logged out from all devices',
        LogActionType.USER_LOGOUT_ALL,
        expect.any(Object),
      );
    });

    it('should handle logoutAll errors', async () => {
      const error = new UnauthorizedException('Failed to logout all sessions');
      mockAuthService.logoutAll.mockRejectedValue(error);
      const req = mockRequest('127.0.0.1', mockUserId) as Request & { user: { id: string } };

      await expect(controller.logoutAll(req)).rejects.toThrow(error);
      expect(mockLoggingService.log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'Failed to logout from all devices',
        LogActionType.USER_LOGOUT_ALL_FAILED,
        expect.any(Object),
      );
    });
  });
});
