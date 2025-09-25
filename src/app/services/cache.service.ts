import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

/**
 * Cache entry interface with TTL support
 */
export interface CacheEntry<T> {
  value: T;
  expiry: number;
  createdAt: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Cache configuration options
 */
export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

/**
 * Memory-based cache service with RxJS integration
 * Provides TTL support, automatic cleanup, and statistics tracking
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTTL = 10 * 60 * 1000; // 10 minutes
  private readonly maxSize = 100;
  private cleanupInterval: any;
  private stats = {
    hits: 0,
    misses: 0
  };

  constructor() {
    // Start automatic cleanup every minute
    this.startCleanupInterval();
  }

  /**
   * Retrieves a value from the cache
   * @param key - The cache key
   * @returns Observable of the cached value or null if not found/expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Stores a value in the cache
   * @param key - The cache key
   * @param value - The value to cache
   * @param options - Cache options (TTL, etc.)
   * @returns boolean indicating success
   */
  set<T>(key: string, value: T, options?: CacheOptions): boolean {
    const now = Date.now();
    const ttl = options?.ttl || this.defaultTTL;
    const entry: CacheEntry<T> = {
      value,
      expiry: now + ttl,
      createdAt: now
    };

    // Enforce max size by removing oldest entries
    if (this.cache.size >= this.maxSize) {
      this.evictOldestEntry();
    }

    this.cache.set(key, entry);
    return true;
  }

  /**
   * Checks if a key exists in the cache and is not expired
   * @param key - The cache key
   * @returns boolean indicating presence
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry || this.isExpired(entry)) {
      if (entry) {
        this.cache.delete(key);
      }
      return false;
    }

    return true;
  }

  /**
   * Removes a specific key from the cache
   * @param key - The cache key
   * @returns boolean indicating success
   */
  delete(key: string): boolean {
    const existed = this.cache.delete(key);
    return existed;
  }

  /**
   * Clears all entries from the cache
   * @returns Observable of boolean indicating success
   */
  clear(): Observable<boolean> {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    return of(true);
  }

  /**
   * Gets cache statistics
   * @returns Observable of cache statistics
   */
  getStats(): Observable<CacheStats> {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return of({
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100
    });
  }

  /**
   * Generates a cache key from URL and optional parameters
   * @param url - The base URL
   * @param params - Optional parameters to include in key
   * @returns Generated cache key
   */
  generateKey(url: string, params?: Record<string, any>): string {
    let key = url;
    if (params && Object.keys(params).length > 0) {
      const queryString = Object.keys(params)
        .sort()
        .map(k => `${k}=${JSON.stringify(params[k])}`)
        .join('&');
      key += `?${queryString}`;
    }
    return key; 
  }

  /**
   * Manually triggers cleanup of expired entries
   * @returns Observable of number of entries removed
   */
  cleanup(): Observable<number> {
    let removedCount = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry <= now) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    return of(removedCount);
  }

  /**
   * Checks if a cache entry is expired
   * @param entry - The cache entry
   * @returns Whether the entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiry;
  }

  /**
   * Evicts the oldest entry when cache is full
   */
  private evictOldestEntry(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Starts the automatic cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup().subscribe();
    }, 60000); // Clean up every minute
  }

  /**
   * Cleanup resources when service is destroyed
   */
  ngOnDestroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}
