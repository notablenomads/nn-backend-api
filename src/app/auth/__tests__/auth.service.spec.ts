import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { RefreshTokenService } from '../services/refresh-token.service';
import { CryptoService } from '../../core/services/crypto.service';
import { TokenBlacklistService } from '../services/token-blacklist.service';
import { User } from '../../user/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let refreshTokenService: RefreshTokenService;

  const validatePasswordMock = jest.fn();
  const mockUser = {
    id: 'user-id',
    email: 'test@example.com',
    validatePassword: validatePasswordMock,
    roles: ['user'],
  } as unknown as User;

  const mockServices = {
    userService: {
      register: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
    },
    jwtService: {
      sign: jest.fn(),
      decode: jest.fn(),
    },
    configService: {
      get: jest.fn(),
    },
    refreshTokenService: {
      validateToken: jest.fn(),
      replaceToken: jest.fn(),
      createToken: jest.fn(),
      createRefreshToken: jest.fn(),
      revokeToken: jest.fn(),
      revokeAllUserTokens: jest.fn(),
      findValidTokensByUserId: jest.fn(),
    },
    cryptoService: {
      hash: jest.fn(),
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
        { provide: UserService, useValue: mockServices.userService },
        { provide: JwtService, useValue: mockServices.jwtService },
        { provide: ConfigService, useValue: mockServices.configService },
        { provide: RefreshTokenService, useValue: mockServices.refreshTokenService },
        { provide: CryptoService, useValue: mockServices.cryptoService },
        { provide: TokenBlacklistService, useValue: mockServices.tokenBlacklistService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'Password123!',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should register a new user and return tokens', async () => {
      mockServices.userService.register.mockResolvedValue(mockUser);
      mockServices.jwtService.sign.mockReturnValue('access-token');
      mockServices.refreshTokenService.createRefreshToken.mockResolvedValue({ token: 'refresh-token' });

      const result = await service.register(registerDto);

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(userService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    beforeEach(() => {
      // Reset the failed login attempts for each test
      mockServices.configService.get.mockImplementation((key) => {
        if (key === 'auth.maxLoginAttempts') return 3;
        if (key === 'auth.loginBlockDuration') return '15m';
        return null;
      });
    });

    it('should login successfully and return tokens', async () => {
      mockServices.userService.findByEmail.mockResolvedValue(mockUser);
      validatePasswordMock.mockResolvedValue(true);
      mockServices.jwtService.sign.mockReturnValue('access-token');
      mockServices.refreshTokenService.createRefreshToken.mockResolvedValue({ token: 'refresh-token' });

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      mockServices.userService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      mockServices.userService.findByEmail.mockResolvedValue(mockUser);
      validatePasswordMock.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should block login after too many failed attempts', async () => {
      mockServices.userService.findByEmail.mockResolvedValue(mockUser);
      validatePasswordMock.mockResolvedValue(false);

      // Simulate multiple failed login attempts
      for (let i = 0; i < 5; i++) {
        try {
          await service.login(loginDto);
        } catch (error) {
          expect(error).toBeInstanceOf(UnauthorizedException);
        }
      }

      // Next attempt should be blocked
      try {
        await service.login(loginDto);
        fail('Expected login to be blocked');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Too many failed attempts. Please try again later.');
      }
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const mockRefreshToken = {
        userId: mockUser.id,
        token: 'valid-refresh-token',
        isValid: true,
      };

      mockServices.refreshTokenService.validateToken.mockResolvedValue(mockRefreshToken);
      mockServices.userService.findById.mockResolvedValue(mockUser);
      mockServices.jwtService.sign.mockReturnValue('new-access-token');
      mockServices.refreshTokenService.replaceToken.mockResolvedValue({ token: 'new-refresh-token' });

      const result = await service.refreshTokens('valid-refresh-token', mockUser.id);

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockServices.refreshTokenService.validateToken.mockResolvedValue(null);

      await expect(service.refreshTokens('invalid-token', mockUser.id)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for mismatched user ID', async () => {
      const mockRefreshToken = {
        userId: 'different-user-id',
        token: 'valid-refresh-token',
        isValid: true,
      };

      mockServices.refreshTokenService.validateToken.mockResolvedValue(mockRefreshToken);

      await expect(service.refreshTokens('valid-refresh-token', mockUser.id)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const refreshToken = 'valid-refresh-token';
      mockServices.refreshTokenService.validateToken.mockResolvedValue({ userId: mockUser.id });
      mockServices.refreshTokenService.revokeToken.mockResolvedValue(undefined);

      await service.logout(refreshToken);

      expect(refreshTokenService.revokeToken).toHaveBeenCalledWith(refreshToken);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      mockServices.refreshTokenService.validateToken.mockResolvedValue(null);

      await expect(service.logout('invalid-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logoutAll', () => {
    it('should logout all sessions for a user', async () => {
      const userId = mockUser.id;
      const mockTokens = [{ token: 'token1' }, { token: 'token2' }];

      mockServices.refreshTokenService.findValidTokensByUserId.mockResolvedValue(mockTokens);
      mockServices.refreshTokenService.revokeAllUserTokens.mockResolvedValue(undefined);

      await service.logoutAll(userId);

      expect(refreshTokenService.findValidTokensByUserId).toHaveBeenCalledWith(userId);
      expect(refreshTokenService.revokeAllUserTokens).toHaveBeenCalledWith(userId);
    });
  });
});
