import { Injectable } from "@nestjs/common";

/**
 * In-memory cache service implementation.
 * Provides a simple key-value store for application data caching.
 */
@Injectable()
export class CacheService {
  private cache: Record<string, any> = {};

  /**
   * Stores a value in the cache with the specified key.
   * @param {string} key Unique identifier for the cached item
   * @param {any} value Value to be stored in the cache
   */
  set(key: string, value: any): void {
    this.cache[key] = value;
  }

  /**
   * Retrieves a value from the cache by key.
   * @param {string} key Unique identifier for the cached item
   * @returns {any} Cached value or undefined if key not found
   */
  get(key: string): any {
    return this.cache[key];
  }
}
