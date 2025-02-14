import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { RefreshTokenService } from '../services/refresh-token.service';
import { LoggingService } from '../../logging/services/logging.service';
import { CryptoService } from '../../core/services/crypto.service';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { LogLevel, LogActionType } from '../../logging/entities/log-entry.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  const mockServices = {
    userService: {
      register: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      updateFailedLoginAttempts: jest.fn(),
      resetFailedLoginAttempts: jest.fn(),
    },
    refreshTokenService: {
      createRefreshToken: jest.fn(),
      validateToken: jest.fn(),
      revokeToken: jest.fn(),
      revokeAllUserTokens: jest.fn(),
    },
    jwtService: {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    },
    loggingService: {
      log: jest.fn(),
    },
    configService: {
      get: jest.fn(),
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: mockServices.userService,
        },
        {
          provide: RefreshTokenService,
          useValue: mockServices.refreshTokenService,
        },
        {
          provide: JwtService,
          useValue: mockServices.jwtService,
        },
        {
          provide: LoggingService,
          useValue: mockServices.loggingService,
        },
        {
          provide: ConfigService,
          useValue: mockServices.configService,
        },
        {
          provide: CryptoService,
          useValue: mockServices.cryptoService,
        },
        {
          provide: TokenBlacklistService,
          useValue: mockServices.tokenBlacklistService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockRegisterDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    const mockUser = {
      id: '123',
      email: 'test@example.com',
      password: 'hashedPassword',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user successfully', async () => {
      mockServices.userService.register.mockResolvedValue(mockUser);
      mockServices.jwtService.signAsync.mockResolvedValue('token');
      mockServices.refreshTokenService.createRefreshToken.mockResolvedValue({ token: 'refreshToken' });

      const result = await service.register(mockRegisterDto);

      expect(result).toEqual({
        accessToken: 'token',
        refreshToken: 'refreshToken',
        userId: mockUser.id,
        email: mockUser.email,
      });
      expect(mockServices.loggingService.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'User registered successfully',
        LogActionType.USER_REGISTRATION,
        expect.any(Object),
      );
    });

    it('should handle registration errors', async () => {
      const error = new Error('Registration failed');
      mockServices.userService.register.mockRejectedValue(error);

      await expect(service.register(mockRegisterDto)).rejects.toThrow(error);
      expect(mockServices.loggingService.log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'Registration failed',
        LogActionType.USER_REGISTRATION_FAILED,
        expect.any(Object),
      );
    });
  });

  describe('login', () => {
    const mockLoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockUser = {
      id: '123',
      email: 'test@example.com',
      password: 'hashedPassword',
    };

    beforeEach(() => {
      mockServices.cryptoService.comparePasswords.mockResolvedValue(true);
    });

    it('should login user successfully', async () => {
      mockServices.userService.findByEmail.mockResolvedValue(mockUser);
      mockServices.jwtService.signAsync.mockResolvedValue('token');
      mockServices.refreshTokenService.createRefreshToken.mockResolvedValue({ token: 'refreshToken' });

      const result = await service.login(mockLoginDto);

      expect(result).toEqual({
        accessToken: 'token',
        refreshToken: 'refreshToken',
        userId: mockUser.id,
        email: mockUser.email,
      });
      expect(mockServices.loggingService.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'User logged in successfully',
        LogActionType.USER_LOGIN,
        expect.any(Object),
      );
    });

    it('should handle login errors', async () => {
      mockServices.userService.findByEmail.mockResolvedValue(null);

      await expect(service.login(mockLoginDto)).rejects.toThrow(UnauthorizedException);
      expect(mockServices.loggingService.log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'Login failed',
        LogActionType.USER_LOGIN_FAILED,
        expect.any(Object),
      );
    });
  });

  describe('refreshTokens', () => {
    const mockRefreshToken = 'refresh-token';
    const mockAccessToken = 'access-token';

    it('should refresh tokens successfully', async () => {
      const mockUserId = '123';
      const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
      };

      mockServices.refreshTokenService.validateToken.mockResolvedValue({ userId: mockUserId, token: mockRefreshToken });
      mockServices.userService.findById.mockResolvedValue(mockUser);
      mockServices.jwtService.signAsync.mockResolvedValue('new-token');
      mockServices.refreshTokenService.createRefreshToken.mockResolvedValue({ token: 'new-refresh-token' });

      const result = await service.refreshTokens(mockRefreshToken, mockUserId);

      expect(result).toEqual({
        accessToken: 'new-token',
        refreshToken: 'new-refresh-token',
        userId: mockUser.id,
        email: mockUser.email,
      });
      expect(mockServices.loggingService.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'Token refreshed successfully',
        LogActionType.TOKEN_REFRESH,
        expect.any(Object),
      );
    });

    it('should handle refresh token errors', async () => {
      mockServices.refreshTokenService.validateToken.mockResolvedValue(null);

      await expect(service.refreshTokens(mockAccessToken, mockRefreshToken)).rejects.toThrow(UnauthorizedException);
      expect(mockServices.loggingService.log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'Token refresh failed',
        LogActionType.TOKEN_REFRESH_FAILED,
        expect.any(Object),
      );
    });
  });

  describe('logout', () => {
    const mockRefreshToken = 'refresh-token';
    const mockValidToken = { userId: '123' };

    it('should logout successfully', async () => {
      mockServices.refreshTokenService.validateToken.mockResolvedValue(mockValidToken);

      await service.logout(mockRefreshToken);

      expect(mockServices.refreshTokenService.revokeToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockServices.loggingService.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'User logged out successfully',
        LogActionType.USER_LOGOUT,
        expect.any(Object),
      );
    });

    it('should handle invalid refresh token', async () => {
      mockServices.refreshTokenService.validateToken.mockResolvedValue(null);

      await expect(service.logout(mockRefreshToken)).rejects.toThrow(UnauthorizedException);
      expect(mockServices.loggingService.log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'Logout failed',
        LogActionType.USER_LOGOUT_FAILED,
        expect.any(Object),
      );
    });
  });

  describe('logoutAll', () => {
    const mockUserId = '123';
    const mockUser = {
      id: mockUserId,
      email: 'test@example.com',
    };

    it('should logout all sessions successfully', async () => {
      mockServices.userService.findById.mockResolvedValue(mockUser);
      await service.logoutAll(mockUserId);

      expect(mockServices.refreshTokenService.revokeAllUserTokens).toHaveBeenCalledWith(mockUserId);
      expect(mockServices.loggingService.log).toHaveBeenCalledWith(
        LogLevel.INFO,
        'All sessions logged out successfully',
        LogActionType.USER_LOGOUT_ALL,
        expect.any(Object),
      );
    });

    it('should handle errors during logoutAll', async () => {
      mockServices.userService.findById.mockResolvedValue(mockUser);
      const error = new Error('Failed to logout all sessions');
      mockServices.refreshTokenService.revokeAllUserTokens.mockRejectedValue(error);

      await expect(service.logoutAll(mockUserId)).rejects.toThrow(error);
      expect(mockServices.loggingService.log).toHaveBeenCalledWith(
        LogLevel.ERROR,
        'Logout all sessions failed',
        LogActionType.USER_LOGOUT_ALL_FAILED,
        expect.any(Object),
      );
    });
  });
});
