import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { MoreThan } from 'typeorm';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiKey } from './api-key.entity';

@Injectable()
export class ApiKeyService {
  private readonly logger = new Logger(ApiKeyService.name);
  private readonly KEY_LENGTH = 32;
  private readonly SALT_ROUNDS = 10;
  private readonly DEFAULT_EXPIRY_DAYS = 30;

  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  async generateNewApiKey(description?: string): Promise<{ apiKey: string; expiresAt: Date }> {
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

    this.logger.log(`New API key generated with ID: ${apiKeyEntity.id}`);
    return { apiKey, expiresAt };
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    try {
      // Find the key directly using a database query
      const key = await this.apiKeyRepository.findOne({
        where: {
          isActive: true,
          expiresAt: MoreThan(new Date()),
        },
        select: ['id', 'hashedKey'], // Only select needed fields
      });

      if (!key) {
        this.logger.warn('No matching active API key found');
        return false;
      }

      const isValid = await bcrypt.compare(apiKey, key.hashedKey);

      if (isValid) {
        // Update last used timestamp only if key is valid
        await this.apiKeyRepository.update(key.id, {
          lastUsedAt: new Date(),
        });
        return true;
      }

      this.logger.warn('Invalid API key attempt');
      return false;
    } catch (error) {
      this.logger.error('Error validating API key', { error: error.message });
      return false;
    }
  }

  async rotateApiKey(currentApiKey: string): Promise<{ apiKey: string; expiresAt: Date }> {
    try {
      // Find the key directly using a database query
      const key = await this.apiKeyRepository.findOne({
        where: { isActive: true },
        select: ['id', 'hashedKey', 'description'],
      });

      if (!key || !(await bcrypt.compare(currentApiKey, key.hashedKey))) {
        throw new UnauthorizedException('Invalid API key');
      }

      // Deactivate the current key
      await this.apiKeyRepository.update(key.id, { isActive: false });

      // Generate a new key
      return this.generateNewApiKey(key.description);
    } catch (error) {
      this.logger.error('Error rotating API key', { error: error.message });
      throw new UnauthorizedException('Failed to rotate API key');
    }
  }

  async deactivateApiKey(apiKey: string): Promise<void> {
    try {
      // Find the key directly using a database query
      const key = await this.apiKeyRepository.findOne({
        where: { isActive: true },
        select: ['id', 'hashedKey'],
      });

      if (!key || !(await bcrypt.compare(apiKey, key.hashedKey))) {
        throw new UnauthorizedException('Invalid API key');
      }

      await this.apiKeyRepository.update(key.id, { isActive: false });
      this.logger.log(`API key deactivated: ${key.id}`);
    } catch (error) {
      this.logger.error('Error deactivating API key', { error: error.message });
      throw new UnauthorizedException('Failed to deactivate API key');
    }
  }
}
