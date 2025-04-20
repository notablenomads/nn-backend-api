import { Request } from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokensDto } from '../dto/refresh-tokens.dto';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
  };

  const mockRequest = (ip = '127.0.0.1', userId?: string, exp?: number) => {
    return {
      ip,
      user: userId ? { id: userId, exp } : undefined,
      get: jest.fn(),
      header: jest.fn(),
      accepts: jest.fn(),
      acceptsCharsets: jest.fn(),
      acceptsEncodings: jest.fn(),
      acceptsLanguages: jest.fn(),
      param: jest.fn(),
      is: jest.fn(),
      protocol: 'http',
      secure: false,
      ips: [],
      subdomains: [],
      path: '',
      hostname: '',
      host: '',
      fresh: false,
      stale: true,
      xhr: false,
      cookies: {},
      signedCookies: {},
      secret: undefined,
      app: {},
      baseUrl: '',
      originalUrl: '',
      url: '',
      method: 'GET',
      params: {},
      query: {},
      route: {},
      originalMethod: '',
      body: {},
      headers: {},
      rawHeaders: [],
      httpVersion: '1.1',
      httpVersionMajor: 1,
      httpVersionMinor: 1,
    } as unknown as Request;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
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

      const result = await controller.register(registerDto);

      expect(result).toEqual(mockResponse);
    });

    it('should handle registration errors', async () => {
      const error = new BadRequestException('Registration failed');
      mockAuthService.register.mockRejectedValue(error);

      await expect(controller.register(registerDto)).rejects.toThrow(error);
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

      const result = await controller.login(loginDto);

      expect(result).toEqual(mockResponse);
    });

    it('should handle login errors', async () => {
      const error = new UnauthorizedException('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(error);
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
    });

    it('should handle refresh token errors', async () => {
      const error = new UnauthorizedException('Invalid refresh token');
      mockAuthService.refreshTokens.mockRejectedValue(error);
      const req = mockRequest('127.0.0.1', '123', Math.floor(Date.now() / 1000) + 3600) as Request & {
        user: { id: string; exp: number };
      };

      await expect(controller.refreshTokens(refreshTokenDto, req)).rejects.toThrow(error);
    });
  });

  describe('logout', () => {
    const refreshTokenDto: RefreshTokensDto = {
      refreshToken: 'refresh-token',
    };

    it('should logout successfully', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      await controller.logout(refreshTokenDto);

      expect(mockAuthService.logout).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
    });

    it('should handle logout errors', async () => {
      const error = new UnauthorizedException('Invalid refresh token');
      mockAuthService.logout.mockRejectedValue(error);

      await expect(controller.logout(refreshTokenDto)).rejects.toThrow(error);
    });
  });

  describe('logoutAll', () => {
    const mockUserId = '123';

    it('should logout all sessions successfully', async () => {
      mockAuthService.logoutAll.mockResolvedValue(undefined);
      const req = mockRequest('127.0.0.1', mockUserId) as Request & { user: { id: string } };

      await controller.logoutAll(req);

      expect(mockAuthService.logoutAll).toHaveBeenCalledWith(mockUserId);
    });

    it('should handle logoutAll errors', async () => {
      const error = new UnauthorizedException('Failed to logout all sessions');
      mockAuthService.logoutAll.mockRejectedValue(error);
      const req = mockRequest('127.0.0.1', mockUserId) as Request & { user: { id: string } };

      await expect(controller.logoutAll(req)).rejects.toThrow(error);
    });
  });
});
