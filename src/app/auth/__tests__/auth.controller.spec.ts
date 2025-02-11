import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokensDto } from '../dto/refresh-tokens.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    refreshTokens: jest.fn(),
    logout: jest.fn(),
    logoutAll: jest.fn(),
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
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      const expectedResult = { accessToken: 'access', refreshToken: 'refresh' };
      mockAuthService.register.mockResolvedValue(expectedResult);

      const result = await controller.register(registerDto);

      expect(result).toBe(expectedResult);
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it('should throw an error if registration fails', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Registration failed'));

      await expect(controller.register(registerDto)).rejects.toThrow('Registration failed');
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    it('should login user successfully', async () => {
      const expectedResult = { accessToken: 'access', refreshToken: 'refresh' };
      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await controller.login(loginDto);

      expect(result).toBe(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(new UnauthorizedException());

      await expect(controller.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    const refreshTokenDto: RefreshTokensDto = {
      refreshToken: 'valid-refresh-token',
    };
    const mockReq = {
      user: { sub: 'user-id', exp: Math.floor(Date.now() / 1000) + 3600 },
    };

    it('should refresh tokens successfully', async () => {
      const expectedResult = { accessToken: 'new-access', refreshToken: 'new-refresh' };
      mockAuthService.refreshTokens.mockResolvedValue(expectedResult);

      const result = await controller.refreshTokens(refreshTokenDto, mockReq);

      expect(result).toBe(expectedResult);
      expect(authService.refreshTokens).toHaveBeenCalledWith(refreshTokenDto.refreshToken, mockReq.user.sub);
    });

    it('should throw UnauthorizedException for expired access token', async () => {
      const expiredReq = {
        user: { sub: 'user-id', exp: Math.floor(Date.now() / 1000) - 3600 },
      };

      await expect(controller.refreshTokens(refreshTokenDto, expiredReq)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    const refreshTokenDto: RefreshTokensDto = {
      refreshToken: 'valid-refresh-token',
    };

    it('should logout successfully', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      await controller.logout(refreshTokenDto);

      expect(authService.logout).toHaveBeenCalledWith(refreshTokenDto.refreshToken);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockAuthService.logout.mockRejectedValue(new UnauthorizedException());

      await expect(controller.logout(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logoutAll', () => {
    const mockReq = {
      user: { sub: 'user-id' },
    };

    it('should logout from all sessions successfully', async () => {
      mockAuthService.logoutAll.mockResolvedValue(undefined);

      await controller.logoutAll(mockReq);

      expect(authService.logoutAll).toHaveBeenCalledWith(mockReq.user.sub);
    });

    it('should throw UnauthorizedException when logout all fails', async () => {
      mockAuthService.logoutAll.mockRejectedValue(new UnauthorizedException());

      await expect(controller.logoutAll(mockReq)).rejects.toThrow(UnauthorizedException);
    });
  });
});
