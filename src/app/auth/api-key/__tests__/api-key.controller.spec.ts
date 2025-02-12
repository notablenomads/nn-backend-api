import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { ApiKeyController } from '../api-key.controller';
import { ApiKeyService } from '../api-key.service';
import { AuthGuard } from '../../../core/guards/auth.guard';

describe('ApiKeyController', () => {
  let controller: ApiKeyController;
  let service: ApiKeyService;

  const mockApiKeyService = {
    generateNewApiKey: jest.fn(),
    rotateApiKey: jest.fn(),
    deactivateApiKey: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApiKeyController],
      providers: [
        {
          provide: ApiKeyService,
          useValue: mockApiKeyService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        AuthGuard,
        Reflector,
      ],
    }).compile();

    controller = module.get<ApiKeyController>(ApiKeyController);
    service = module.get<ApiKeyService>(ApiKeyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateApiKey', () => {
    it('should generate a new API key successfully', async () => {
      const description = 'Test API Key';
      const expectedResult = { apiKey: 'new-key', expiresAt: new Date() };
      mockApiKeyService.generateNewApiKey.mockResolvedValue(expectedResult);

      const result = await controller.generateApiKey(description);

      expect(result).toBe(expectedResult);
      expect(service.generateNewApiKey).toHaveBeenCalledWith(description);
    });

    it('should handle errors during key generation', async () => {
      mockApiKeyService.generateNewApiKey.mockRejectedValue(new Error('Generation failed'));

      await expect(controller.generateApiKey('Test')).rejects.toThrow('Generation failed');
    });
  });

  describe('rotateApiKey', () => {
    const mockApiKey = 'current-api-key';

    it('should rotate API key successfully', async () => {
      const expectedResult = { apiKey: 'new-key', expiresAt: new Date() };
      mockApiKeyService.rotateApiKey.mockResolvedValue(expectedResult);

      const result = await controller.rotateApiKey(mockApiKey);

      expect(result).toBe(expectedResult);
      expect(service.rotateApiKey).toHaveBeenCalledWith(mockApiKey);
    });

    it('should throw UnauthorizedException for invalid API key', async () => {
      mockApiKeyService.rotateApiKey.mockRejectedValue(new UnauthorizedException());

      await expect(controller.rotateApiKey(mockApiKey)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when no API key provided', async () => {
      await expect(controller.rotateApiKey(undefined)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deactivateApiKey', () => {
    const mockApiKey = 'test-api-key';

    it('should deactivate API key successfully', async () => {
      mockApiKeyService.deactivateApiKey.mockResolvedValue(undefined);

      await controller.deactivateApiKey(mockApiKey);

      expect(service.deactivateApiKey).toHaveBeenCalledWith(mockApiKey);
    });

    it('should throw UnauthorizedException for invalid API key', async () => {
      mockApiKeyService.deactivateApiKey.mockRejectedValue(new UnauthorizedException());

      await expect(controller.deactivateApiKey(mockApiKey)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when no API key provided', async () => {
      await expect(controller.deactivateApiKey(undefined)).rejects.toThrow(UnauthorizedException);
    });
  });
});
