import { Request } from 'express';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokensDto } from '../dto/refresh-tokens.dto';
import { LoggingService } from '../../logging/services/logging.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let loggingService: LoggingService;

  const mockRequest = () => {
    const req = {
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
      correlationId: 'test-correlation-id',
    } as unknown as Request;
    return req;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
            logoutAll: jest.fn(),
          },
        },
        {
          provide: LoggingService,
          useValue: {
            logUserAction: jest.fn(),
            logError: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    loggingService = module.get<LoggingService>(LoggingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      const expectedResult = { accessToken: 'access', refreshToken: 'refresh' };
      jest.spyOn(authService, 'register').mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto, mockRequest());

      expect(result).toEqual(expectedResult);
      expect(loggingService.logUserAction).toHaveBeenCalled();
    });

    it('should throw an error when registration fails', async () => {
      jest.spyOn(authService, 'register').mockRejectedValue(new Error('Registration failed'));

      await expect(controller.register(registerDto, mockRequest())).rejects.toThrow('Registration failed');
      expect(loggingService.logError).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const expectedResult = { accessToken: 'access', refreshToken: 'refresh' };
      jest.spyOn(authService, 'login').mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto, mockRequest());

      expect(result).toEqual(expectedResult);
      expect(loggingService.logUserAction).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when login fails', async () => {
      jest.spyOn(authService, 'login').mockRejectedValue(new UnauthorizedException());

      await expect(controller.login(loginDto, mockRequest())).rejects.toThrow(UnauthorizedException);
      expect(loggingService.logError).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    const refreshTokenDto: RefreshTokensDto = {
      refreshToken: 'refresh-token',
    };

    it('should refresh tokens successfully', async () => {
      const expectedResult = { accessToken: 'new-access', refreshToken: 'new-refresh' };
      jest.spyOn(authService, 'refreshTokens').mockResolvedValue(expectedResult);

      const mockReq = {
        ...mockRequest(),
        user: { id: 'user-id', exp: Math.floor(Date.now() / 1000) + 3600 },
      } as Request & { user: { id: string; exp: number } };

      const result = await controller.refreshTokens(refreshTokenDto, mockReq);

      expect(result).toEqual(expectedResult);
      expect(loggingService.logUserAction).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when token is expired', async () => {
      const expiredReq = {
        ...mockRequest(),
        user: { id: 'user-id', exp: Math.floor(Date.now() / 1000) - 3600 },
      } as Request & { user: { id: string; exp: number } };

      await expect(controller.refreshTokens(refreshTokenDto, expiredReq)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    const refreshTokenDto: RefreshTokensDto = {
      refreshToken: 'refresh-token',
    };

    it('should logout successfully', async () => {
      jest.spyOn(authService, 'logout').mockResolvedValue(undefined);

      const mockReq = {
        ...mockRequest(),
        user: { id: 'user-id' },
      } as Request & { user: { id: string } };

      await controller.logout(refreshTokenDto, mockReq);

      expect(loggingService.logUserAction).toHaveBeenCalled();
      expect(authService.logout).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
    });

    it('should throw UnauthorizedException when logout fails', async () => {
      jest.spyOn(authService, 'logout').mockRejectedValue(new UnauthorizedException());

      const mockReq = {
        ...mockRequest(),
        user: { id: 'user-id' },
      } as Request & { user: { id: string } };

      await expect(controller.logout(refreshTokenDto, mockReq)).rejects.toThrow(UnauthorizedException);
      expect(loggingService.logError).toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    it('should logout from all devices successfully', async () => {
      jest.spyOn(authService, 'logoutAll').mockResolvedValue(undefined);

      const mockReq = {
        ...mockRequest(),
        user: { id: 'user-id' },
      } as Request & { user: { id: string } };

      await controller.logoutAll(mockReq);

      expect(loggingService.logUserAction).toHaveBeenCalled();
      expect(authService.logoutAll).toHaveBeenCalledWith('user-id');
    });

    it('should throw UnauthorizedException when logoutAll fails', async () => {
      jest.spyOn(authService, 'logoutAll').mockRejectedValue(new UnauthorizedException());

      const mockReq = {
        ...mockRequest(),
        user: { id: 'user-id' },
      } as Request & { user: { id: string } };

      await expect(controller.logoutAll(mockReq)).rejects.toThrow(UnauthorizedException);
      expect(loggingService.logError).toHaveBeenCalled();
    });
  });
});
