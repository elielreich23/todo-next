/**
 * Client-side rate limiting utility to prevent excessive API calls
 * and provide user feedback when rate limits are approached.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  key?: string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RequestRecord> = new Map();
  private readonly defaultConfig: RateLimitConfig = {
    maxRequests: 10,
    windowMs: 60000, // 1 minute
  };

  /**
   * Check if a request should be allowed based on rate limits
   * @param key - Unique key for this rate limit (e.g., endpoint path)
   * @param config - Rate limit configuration
   * @returns true if request is allowed, false if rate limited
   */
  isAllowed(key: string, config?: Partial<RateLimitConfig>): boolean {
    const finalConfig = { ...this.defaultConfig, ...config };
    const now = Date.now();
    const record = this.requests.get(key);

    // If no record exists or window has expired, create new record
    if (!record || now > record.resetTime) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + finalConfig.windowMs,
      });
      return true;
    }

    // Check if limit exceeded
    if (record.count >= finalConfig.maxRequests) {
      return false;
    }

    // Increment count
    record.count++;
    this.requests.set(key, record);
    return true;
  }

  /**
   * Get time remaining until rate limit resets
   * @param key - Rate limit key
   * @returns milliseconds until reset, or 0 if no limit active
   */
  getTimeUntilReset(key: string): number {
    const record = this.requests.get(key);
    if (!record) return 0;
    const now = Date.now();
    return Math.max(0, record.resetTime - now);
  }

  /**
   * Get remaining requests in current window
   * @param key - Rate limit key
   * @param config - Rate limit configuration
   * @returns number of remaining requests
   */
  getRemainingRequests(key: string, config?: Partial<RateLimitConfig>): number {
    const finalConfig = { ...this.defaultConfig, ...config };
    const record = this.requests.get(key);
    if (!record) return finalConfig.maxRequests;
    const now = Date.now();
    if (now > record.resetTime) return finalConfig.maxRequests;
    return Math.max(0, finalConfig.maxRequests - record.count);
  }

  /**
   * Reset rate limit for a specific key
   * @param key - Rate limit key
   */
  reset(key: string): void {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limit records
   */
  clear(): void {
    this.requests.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Authentication endpoints - stricter limits
  // Note: Frontend limits should match or be slightly higher than backend limits
  signin: { maxRequests: 10, windowMs: 60000 }, // 10 per minute (backend: 10/minute)
  signup: { maxRequests: 50, windowMs: 60000 }, // 50 per minute (backend: 50/minute in dev, 20/minute in prod)
  passwordReset: { maxRequests: 5, windowMs: 60000 }, // 5 per minute (backend: 3/minute, increased for dev)
  googleAuth: { maxRequests: 10, windowMs: 60000 }, // 10 per minute

  // General API endpoints
  default: { maxRequests: 30, windowMs: 60000 }, // 30 per minute
};

/**
 * Get rate limit config for an endpoint
 */
export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  // Check for specific endpoint configs
  if (endpoint.includes('/signin') || endpoint.includes('/login')) {
    return RATE_LIMIT_CONFIGS.signin;
  }
  if (endpoint.includes('/signup') || endpoint.includes('/register')) {
    return RATE_LIMIT_CONFIGS.signup;
  }
  if (endpoint.includes('/password/reset')) {
    return RATE_LIMIT_CONFIGS.passwordReset;
  }
  if (endpoint.includes('/google')) {
    return RATE_LIMIT_CONFIGS.googleAuth;
  }
  return RATE_LIMIT_CONFIGS.default;
}

/**
 * Format time remaining in a human-readable format
 */
export function formatTimeRemaining(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 1 && remainingSeconds === 0) {
    return '1 minute';
  }
  return `${minutes} minute${minutes !== 1 ? 's' : ''}${remainingSeconds > 0 ? ` and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}` : ''}`;
}
