import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { RefreshTokenService } from '../services/refresh-token.service';
import { CryptoService } from '../../core/services/crypto.service';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { LoggingService } from '../../logging/services/logging.service';
import { LogActionType } from '../../logging/entities/log-entry.entity';

describe('AuthService', () => {
  let service: AuthService;

  const mockServices = {
    userService: {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      register: jest.fn(),
    },
    jwtService: {
      sign: jest.fn(),
      verify: jest.fn(),
    },
    configService: {
      get: jest.fn(),
    },
    refreshTokenService: {
      validateToken: jest.fn(),
      revokeToken: jest.fn(),
      revokeAllUserTokens: jest.fn(),
      createRefreshToken: jest.fn(),
    },
    cryptoService: {
      validatePassword: jest.fn(),
      comparePasswords: jest.fn(),
      hashPassword: jest.fn(),
    },
    tokenBlacklistService: {
      blacklistToken: jest.fn(),
      isBlacklisted: jest.fn(),
    },
    loggingService: {
      logUserAction: jest.fn(),
      logError: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockServices.userService },
        { provide: JwtService, useValue: mockServices.jwtService },
        { provide: ConfigService, useValue: mockServices.configService },
        { provide: RefreshTokenService, useValue: mockServices.refreshTokenService },
        { provide: CryptoService, useValue: mockServices.cryptoService },
        { provide: TokenBlacklistService, useValue: mockServices.tokenBlacklistService },
        { provide: LoggingService, useValue: mockServices.loggingService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockUser = {
      id: 'user-id',
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    };

    it('should register a new user and return tokens', async () => {
      mockServices.userService.register.mockResolvedValue(mockUser);
      mockServices.jwtService.sign.mockReturnValue('access-token');
      mockServices.refreshTokenService.createRefreshToken.mockResolvedValue({ token: 'refresh-token' });

      const result = await service.register(registerDto);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockServices.loggingService.logUserAction).toHaveBeenCalledWith(
        LogActionType.USER_REGISTRATION,
        expect.any(String),
        expect.objectContaining({
          userId: mockUser.id,
        }),
      );
    });

    it('should handle registration failure', async () => {
      const error = new Error('Registration failed');
      mockServices.userService.register.mockRejectedValue(error);

      await expect(service.register(registerDto)).rejects.toThrow(error);
      expect(mockServices.loggingService.logError).toHaveBeenCalledWith(expect.any(String), error, expect.any(Object));
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    const mockUser = {
      id: 'user-id',
      email: loginDto.email,
    };

    it('should login successfully', async () => {
      mockServices.userService.findByEmail.mockResolvedValue({
        ...mockUser,
        password: 'hashed_password',
      });
      mockServices.cryptoService.comparePasswords.mockResolvedValue(true);
      mockServices.jwtService.sign.mockReturnValue('access-token');
      mockServices.refreshTokenService.createRefreshToken.mockResolvedValue({ token: 'refresh-token' });

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockServices.loggingService.logUserAction).toHaveBeenCalledWith(
        LogActionType.USER_LOGIN,
        expect.any(String),
        expect.objectContaining({
          userId: mockUser.id,
        }),
      );
    });

    it('should handle invalid credentials', async () => {
      mockServices.userService.findByEmail.mockResolvedValue(mockUser);
      mockServices.cryptoService.comparePasswords.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockServices.loggingService.logError).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    const mockRefreshToken = 'valid-refresh-token';
    const mockUserId = 'user-id';

    it('should refresh tokens successfully', async () => {
      mockServices.refreshTokenService.validateToken.mockResolvedValue({ userId: mockUserId, token: mockRefreshToken });
      mockServices.userService.findById.mockResolvedValue({ id: mockUserId });
      mockServices.jwtService.sign.mockReturnValue('new-access-token');
      mockServices.refreshTokenService.createRefreshToken.mockResolvedValue({ token: 'new-refresh-token' });

      const result = await service.refreshTokens(mockRefreshToken, mockUserId);

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(mockServices.loggingService.logUserAction).toHaveBeenCalledWith(
        LogActionType.TOKEN_REFRESH,
        expect.any(String),
        expect.objectContaining({
          userId: mockUserId,
        }),
      );
    });

    it('should handle invalid refresh token', async () => {
      mockServices.refreshTokenService.validateToken.mockResolvedValue(null);

      await expect(service.refreshTokens(mockRefreshToken, mockUserId)).rejects.toThrow(UnauthorizedException);
      expect(mockServices.loggingService.logError).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    const mockRefreshToken = 'valid-refresh-token';
    const mockUserId = 'user-id';

    it('should logout successfully', async () => {
      mockServices.refreshTokenService.validateToken.mockResolvedValue({ userId: mockUserId, token: mockRefreshToken });

      await service.logout(mockRefreshToken);

      expect(mockServices.refreshTokenService.revokeToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockServices.loggingService.logUserAction).toHaveBeenCalledWith(
        LogActionType.USER_LOGOUT,
        expect.any(String),
        expect.objectContaining({
          userId: mockUserId,
        }),
      );
    });

    it('should handle invalid refresh token', async () => {
      mockServices.refreshTokenService.validateToken.mockResolvedValue(null);

      await expect(service.logout(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
      expect(mockServices.loggingService.logError).toHaveBeenCalled();
    });
  });

  describe('logoutAll', () => {
    const mockUserId = 'user-id';

    it('should logout all sessions successfully', async () => {
      mockServices.refreshTokenService.revokeAllUserTokens.mockResolvedValue(undefined);

      await service.logoutAll(mockUserId);

      expect(mockServices.refreshTokenService.revokeAllUserTokens).toHaveBeenCalledWith(mockUserId);
      expect(mockServices.loggingService.logUserAction).toHaveBeenCalledWith(
        LogActionType.USER_LOGOUT_ALL,
        expect.any(String),
        expect.objectContaining({
          userId: mockUserId,
        }),
      );
    });

    it('should handle errors during logoutAll', async () => {
      const error = new Error('Failed to logout all sessions');
      mockServices.refreshTokenService.revokeAllUserTokens.mockRejectedValue(error);

      await expect(service.logoutAll(mockUserId)).rejects.toThrow(error);
      expect(mockServices.loggingService.logError).toHaveBeenCalledWith(
        expect.any(String),
        error,
        expect.objectContaining({
          userId: mockUserId,
        }),
      );
    });
  });
});
