import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
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

    const apiKeys = await this.apiKeyRepository.find({
      where: { isActive: true },
    });

    for (const key of apiKeys) {
      if ((await bcrypt.compare(apiKey, key.hashedKey)) && key.expiresAt > new Date() && key.isActive) {
        // Update last used timestamp
        await this.apiKeyRepository.update(key.id, {
          lastUsedAt: new Date(),
        });
        return true;
      }
    }

    this.logger.warn('Invalid or expired API key used');
    return false;
  }

  async rotateApiKey(currentApiKey: string): Promise<{ apiKey: string; expiresAt: Date }> {
    const apiKeys = await this.apiKeyRepository.find({
      where: { isActive: true },
    });

    for (const key of apiKeys) {
      if (await bcrypt.compare(currentApiKey, key.hashedKey)) {
        // Deactivate the current key
        await this.apiKeyRepository.update(key.id, { isActive: false });

        // Generate a new key
        return this.generateNewApiKey(key.description);
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }

  async deactivateApiKey(apiKey: string): Promise<void> {
    const apiKeys = await this.apiKeyRepository.find({
      where: { isActive: true },
    });

    for (const key of apiKeys) {
      if (await bcrypt.compare(apiKey, key.hashedKey)) {
        await this.apiKeyRepository.update(key.id, { isActive: false });
        this.logger.log(`API key deactivated: ${key.id}`);
        return;
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
