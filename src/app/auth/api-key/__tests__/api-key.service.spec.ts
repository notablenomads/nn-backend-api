import * as bcrypt from 'bcrypt';
import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { ApiKeyService } from '../api-key.service';
import { ApiKey } from '../api-key.entity';

describe('ApiKeyService', () => {
  let apiKeyService: ApiKeyService;

  const mockApiKeyRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyService,
        {
          provide: getRepositoryToken(ApiKey),
          useValue: mockApiKeyRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    apiKeyService = module.get<ApiKeyService>(ApiKeyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateNewApiKey', () => {
    it('should generate a new API key successfully', async () => {
      const apiKeyDescription = 'Test API Key';
      const mockApiKey = {
        id: 'key-id',
        hashedKey: 'hashed-key',
        description: apiKeyDescription,
        isActive: true,
        expiresAt: expect.any(Date),
      };

      mockApiKeyRepository.create.mockReturnValue(mockApiKey);
      mockApiKeyRepository.save.mockResolvedValue(mockApiKey);

      const result = await apiKeyService.generateNewApiKey(apiKeyDescription);

      expect(result).toHaveProperty('apiKey');
      expect(result).toHaveProperty('expiresAt');
      expect(mockApiKeyRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          description: apiKeyDescription,
          isActive: true,
        }),
      );
    });

    it('should handle errors during key generation', async () => {
      mockApiKeyRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(apiKeyService.generateNewApiKey('Test Key')).rejects.toThrow('Failed to generate API key');
    });
  });

  describe('validateApiKey', () => {
    const apiKey = 'test-api-key';
    const cacheKey = `api_key_attempts_${apiKey}`;

    it('should validate API key successfully', async () => {
      const hashedKey = await bcrypt.hash(apiKey, 10);
      mockCacheManager.get.mockResolvedValue(0);
      mockApiKeyRepository.find.mockResolvedValue([
        {
          id: 'key-id',
          hashedKey,
          isActive: true,
        },
      ]);

      const result = await apiKeyService.validateApiKey(apiKey);

      expect(result).toBe(true);
      expect(mockCacheManager.del).toHaveBeenCalledWith(cacheKey);
      expect(mockApiKeyRepository.update).toHaveBeenCalled();
    });

    it('should block validation after max attempts', async () => {
      mockCacheManager.get.mockResolvedValue(5);

      const result = await apiKeyService.validateApiKey(apiKey);

      expect(result).toBe(false);
      expect(mockCacheManager.set).toHaveBeenCalledWith(cacheKey, 6, expect.any(Number));
    });

    it('should increment failed attempts for invalid key', async () => {
      mockCacheManager.get.mockResolvedValue(1);
      mockApiKeyRepository.find.mockResolvedValue([]);

      const result = await apiKeyService.validateApiKey(apiKey);

      expect(result).toBe(false);
      expect(mockCacheManager.set).toHaveBeenCalledWith(cacheKey, 2, 3600);
    });
  });

  describe('rotateApiKey', () => {
    const currentApiKey = 'current-api-key';

    it('should rotate API key successfully', async () => {
      const hashedKey = await bcrypt.hash(currentApiKey, 10);
      const mockExistingKey = {
        id: 'key-id',
        hashedKey,
        description: 'Test Key',
        lastUsedAt: new Date(),
        isActive: true,
      };

      mockApiKeyRepository.find.mockResolvedValue([mockExistingKey]);
      mockApiKeyRepository.save.mockImplementation((entity) => entity);

      const result = await apiKeyService.rotateApiKey(currentApiKey);

      expect(result).toHaveProperty('apiKey');
      expect(result).toHaveProperty('expiresAt');
      expect(mockApiKeyRepository.update).toHaveBeenCalledWith(
        'key-id',
        expect.objectContaining({
          isActive: false,
          expiresAt: expect.any(Date),
        }),
      );
    });

    it('should throw UnauthorizedException for invalid current key', async () => {
      mockApiKeyRepository.find.mockResolvedValue([]);

      await expect(apiKeyService.rotateApiKey(currentApiKey)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('deactivateApiKey', () => {
    const apiKeyToDeactivate = 'test-api-key';

    it('should deactivate API key successfully', async () => {
      const hashedKey = await bcrypt.hash(apiKeyToDeactivate, 10);
      const mockExistingKey = {
        id: 'key-id',
        hashedKey,
        isActive: true,
      };

      mockApiKeyRepository.find.mockResolvedValue([mockExistingKey]);

      await apiKeyService.deactivateApiKey(apiKeyToDeactivate);

      expect(mockApiKeyRepository.update).toHaveBeenCalledWith(
        'key-id',
        expect.objectContaining({
          isActive: false,
          updatedAt: expect.any(Date),
        }),
      );
    });

    it('should throw UnauthorizedException for invalid key', async () => {
      mockApiKeyRepository.find.mockResolvedValue([]);

      await expect(apiKeyService.deactivateApiKey(apiKeyToDeactivate)).rejects.toThrow(UnauthorizedException);
    });
  });
});
