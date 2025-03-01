import * as NodeCache from 'node-cache';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CacheService {
  private cache: NodeCache;
  private readonly logger = new Logger(CacheService.name);

  constructor() {
    // Default TTL: 15 minutes, check period: 60 seconds
    this.cache = new NodeCache({
      stdTTL: 900,
      checkperiod: 60,
      useClones: false,
    });

    this.logger.log('Cache service initialized');
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  /**
   * Set a value in cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): boolean {
    return this.cache.set<T>(key, value, ttl);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Remove a key from cache
   */
  delete(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Clear all cache
   */
  flush(): void {
    this.cache.flushAll();
  }

  /**
   * Get value from cache or set it if not exists
   * using the factory function
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = this.get<T>(key);

    if (cachedValue !== undefined) {
      return cachedValue;
    }

    try {
      const value = await factory();
      this.set(key, value, ttl);
      return value;
    } catch (error) {
      this.logger.error(`Error fetching data for cache key ${key}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return this.cache.getStats();
  }
}
