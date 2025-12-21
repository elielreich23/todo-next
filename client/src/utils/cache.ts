/**
 * API Response Caching Utility
 * Provides client-side caching for API responses to reduce network requests
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly defaultTTL: number = 5 * 60 * 1000; // 5 minutes default
  private readonly defaultMaxSize: number = 100; // Maximum 100 entries

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, config?: CacheConfig): void {
    const ttl = config?.ttl || this.defaultTTL;
    const expiresAt = Date.now() + ttl;

    // Check max size and remove oldest if needed
    if (this.cache.size >= (config?.maxSize || this.defaultMaxSize)) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt,
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let valid = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
    };
  }
}

// Singleton instance
export const apiCache = new APICache();

// Cache configuration for different endpoints
export const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // User profile - cache for 10 minutes
  profile: { ttl: 10 * 60 * 1000 },

  // Projects list - cache for 5 minutes
  projects: { ttl: 5 * 60 * 1000 },

  // Users list - cache for 5 minutes
  users: { ttl: 5 * 60 * 1000 },

  // Static data - cache for 30 minutes
  static: { ttl: 30 * 60 * 1000 },

  // Default - 2 minutes
  default: { ttl: 2 * 60 * 1000 },
};

/**
 * Generate cache key from endpoint and params
 */
export function generateCacheKey(endpoint: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }

  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');

  return `${endpoint}?${sortedParams}`;
}

/**
 * Get cache config for an endpoint
 */
export function getCacheConfig(endpoint: string): CacheConfig {
  if (endpoint.includes('/profile')) {
    return CACHE_CONFIGS.profile;
  }
  if (endpoint.includes('/projects')) {
    return CACHE_CONFIGS.projects;
  }
  if (endpoint.includes('/users')) {
    return CACHE_CONFIGS.users;
  }
  return CACHE_CONFIGS.default;
}

// Clean up expired entries periodically
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.clearExpired();
  }, 60 * 1000); // Clean up every minute
}
