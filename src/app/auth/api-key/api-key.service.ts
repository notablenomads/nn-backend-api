import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { MoreThan } from 'typeorm';
import { Cache } from 'cache-manager';
import { Injectable, Logger, UnauthorizedException, InternalServerErrorException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ApiKey } from './api-key.entity';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);
  private readonly KEY_LENGTH = 32;
  private readonly SALT_ROUNDS = 10;
  private readonly DEFAULT_EXPIRY_DAYS = 30;
  private readonly MAX_VALIDATION_ATTEMPTS = 5;
  private readonly MAX_BACKOFF_TIME = 30000; // 30 seconds

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async generateNewApiKey(description?: string): Promise<{ apiKey: string; expiresAt: Date }> {
    try {
      // Generate a random API key
      const apiKey = crypto.randomBytes(this.KEY_LENGTH).toString('hex');
      const hashedKey = await bcrypt.hash(apiKey, this.SALT_ROUNDS);

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + this.DEFAULT_EXPIRY_DAYS);

      // Create new API key record
      const apiKeyEntity = this.apiKeyRepository.create({
        hashedKey,
        description,
        expiresAt,
        isActive: true,
      });

      await this.apiKeyRepository.save(apiKeyEntity);

      return {
        apiKey,
        expiresAt,
      };
    } catch (error) {
      this.logger.error('Error generating API key', { error: error.message });
      throw new InternalServerErrorException('Failed to generate API key');
    }
  }

  async rotateApiKey(currentApiKey: string): Promise<{ apiKey: string; expiresAt: Date }> {
    try {
      // Find all active keys and compare with the provided key
      const activeKeys = await this.apiKeyRepository.find({
        where: { isActive: true },
        select: ['id', 'hashedKey', 'description', 'lastUsedAt'],
      });

      // Find the matching key
      const matchingKey = await this.findMatchingKey(activeKeys, currentApiKey);

      if (!matchingKey) {
        throw new UnauthorizedException('Invalid API key');
      }

      // Track rotation for security monitoring
      const rotationRecord = {
        oldKeyId: matchingKey.id,
        rotatedAt: new Date(),
        lastUsed: matchingKey.lastUsedAt,
      };
      await this.logKeyRotation(rotationRecord);

      // Deactivate the current key with grace period
      const gracePeriod = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      await this.apiKeyRepository.update(matchingKey.id, {
        isActive: false,
        updatedAt: new Date(),
        expiresAt: gracePeriod,
      });

      // Generate a new key with the same description
      return this.generateNewApiKey(matchingKey.description);
    } catch (error) {
      this.logger.error('Error rotating API key', { error: error.message });
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to rotate API key');
    }
  }

  async deactivateApiKey(apiKey: string): Promise<void> {
    try {
      // Find all active keys and compare with the provided key
      const activeKeys = await this.apiKeyRepository.find({
        where: { isActive: true },
        select: ['id', 'hashedKey'],
      });

      // Find the matching key
      const matchingKey = await this.findMatchingKey(activeKeys, apiKey);

      if (!matchingKey) {
        throw new UnauthorizedException('Invalid API key');
      }

      await this.apiKeyRepository.update(matchingKey.id, {
        isActive: false,
        updatedAt: new Date(),
      });

      this.logger.log(`API key deactivated: ${matchingKey.id}`);
    } catch (error) {
      this.logger.error('Error deactivating API key', { error: error.message });
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to deactivate API key');
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey) {
      return false;
    }

    try {
      const cacheKey = `api_key_attempts_${apiKey}`;
      const attempts = (await this.cacheManager.get<number>(cacheKey)) || 0;

      if (attempts >= this.MAX_VALIDATION_ATTEMPTS) {
        const backoffTime = Math.min(Math.pow(2, attempts) * 1000, this.MAX_BACKOFF_TIME);
        await this.cacheManager.set(cacheKey, attempts + 1, backoffTime);
        this.logger.warn(`API key validation blocked due to too many attempts: ${apiKey}`);
        return false;
      }

      // Find all active and non-expired keys
      const activeKeys = await this.apiKeyRepository.find({
        where: {
          isActive: true,
          expiresAt: MoreThan(new Date()),
        },
        select: ['id', 'hashedKey', 'lastUsedAt'],
      });

      // Find the matching key
      const matchingKey = await this.findMatchingKey(activeKeys, apiKey);

      if (!matchingKey) {
        await this.cacheManager.set(cacheKey, attempts + 1, 3600); // 1 hour
        this.logger.warn(`Invalid API key attempt: ${apiKey}`);
        return false;
      }

      // Reset attempts on successful validation
      await this.cacheManager.del(cacheKey);

      // Update last used timestamp
      await this.apiKeyRepository.update(matchingKey.id, {
        lastUsedAt: new Date(),
        updatedAt: new Date(),
      });

      return true;
    } catch (error) {
      this.logger.error('Error validating API key', { error: error.message });
      return false;
    }
  }

  private async findMatchingKey(keys: ApiKey[], plainApiKey: string): Promise<ApiKey | null> {
    for (const key of keys) {
      if (await bcrypt.compare(plainApiKey, key.hashedKey)) {
        return key;
      }
    }
    return null;
  }

  private async logKeyRotation(record: { oldKeyId: string; rotatedAt: Date; lastUsed: Date }): Promise<void> {
    this.logger.log('API key rotation', {
      oldKeyId: record.oldKeyId,
      rotatedAt: record.rotatedAt,
      lastUsed: record.lastUsed,
      timeSinceLastUse: record.lastUsed ? Date.now() - record.lastUsed.getTime() : null,
    });
  }
}
