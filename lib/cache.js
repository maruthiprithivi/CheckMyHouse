/**
 * Response Cache and Rate Limiting System
 * Reduces ClickHouse query load and prevents quota exhaustion
 */

class ResponseCache {
  constructor() {
    this.cache = new Map();
    this.requestCounts = new Map();
    this.windowStart = Date.now();
  }

  /**
   * Generate cache key from request parameters
   */
  generateKey(prefix, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return `${prefix}:${sortedParams}`;
  }

  /**
   * Get cached response
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    entry.lastAccessed = Date.now();
    return entry.data;
  }

  /**
   * Set cached response with TTL
   */
  set(key, data, ttlSeconds = 60) {
    const entry = {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
      hits: 0,
    };
    this.cache.set(key, entry);

    // Cleanup old entries periodically
    if (this.cache.size > 1000) {
      this.cleanup();
    }
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    // If still too many, remove least recently used
    if (this.cache.size > 500) {
      const entries = Array.from(this.cache.entries()).sort(
        (a, b) => a[1].lastAccessed - b[1].lastAccessed
      );
      const toRemove = entries.slice(0, entries.length - 500);
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let totalHits = 0;
    let validEntries = 0;

    for (const entry of this.cache.values()) {
      if (now <= entry.expiresAt) {
        validEntries++;
        totalHits += entry.hits;
      }
    }

    return {
      size: this.cache.size,
      validEntries,
      totalHits,
      hitRate: validEntries > 0 ? totalHits / validEntries : 0,
    };
  }

  /**
   * Check rate limit for user/endpoint
   */
  checkRateLimit(identifier, maxRequests = 100, windowSeconds = 60) {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;

    // Reset window if needed
    if (now - this.windowStart > windowMs) {
      this.requestCounts.clear();
      this.windowStart = now;
    }

    const key = `rate:${identifier}`;
    const count = this.requestCounts.get(key) || 0;

    if (count >= maxRequests) {
      const resetIn = Math.ceil((windowMs - (now - this.windowStart)) / 1000);
      return {
        allowed: false,
        limit: maxRequests,
        current: count,
        resetIn,
      };
    }

    this.requestCounts.set(key, count + 1);
    return {
      allowed: true,
      limit: maxRequests,
      current: count + 1,
      remaining: maxRequests - count - 1,
    };
  }

  /**
   * Get rate limit status without incrementing
   */
  getRateLimitStatus(identifier, maxRequests = 100) {
    const count = this.requestCounts.get(`rate:${identifier}`) || 0;
    return {
      limit: maxRequests,
      current: count,
      remaining: Math.max(0, maxRequests - count),
    };
  }
}

// Singleton instance
const globalCache = new ResponseCache();

/**
 * Cache TTL configurations for different query types
 */
export const CacheTTL = {
  // Static metadata - cache longer
  DATABASES: 300, // 5 minutes
  TABLES: 300, // 5 minutes
  COLUMNS: 300, // 5 minutes
  CLUSTER_CONFIG: 600, // 10 minutes

  // Dynamic statistics - cache shorter
  TABLE_STATS: 60, // 1 minute
  QUERY_ANALYZER: 60, // 1 minute
  SLOW_QUERIES: 30, // 30 seconds

  // Real-time data - minimal cache
  QUERY_DRILLDOWN: 10, // 10 seconds
  MONITORING: 5, // 5 seconds
};

/**
 * Rate limit configurations
 */
export const RateLimits = {
  DEFAULT: { maxRequests: 100, window: 60 }, // 100 requests per minute
  HEAVY_QUERY: { maxRequests: 20, window: 60 }, // 20 heavy queries per minute
  METADATA: { maxRequests: 200, window: 60 }, // 200 metadata requests per minute
};

/**
 * Middleware to add caching to API responses
 */
export function withCache(handler, options = {}) {
  const {
    ttl = CacheTTL.QUERY_ANALYZER,
    keyGenerator = null,
    rateLimit = RateLimits.DEFAULT,
  } = options;

  return async (request) => {
    try {
      // Generate cache key
      const url = new URL(request.url);
      const params = Object.fromEntries(url.searchParams);
      const cacheKey = keyGenerator
        ? keyGenerator(request, params)
        : globalCache.generateKey(url.pathname, params);

      // Check rate limit
      const rateLimitStatus = globalCache.checkRateLimit(
        url.pathname,
        rateLimit.maxRequests,
        rateLimit.window
      );

      if (!rateLimitStatus.allowed) {
        return {
          error: 'Rate limit exceeded',
          type: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitStatus.resetIn,
          limit: rateLimitStatus.limit,
          current: rateLimitStatus.current,
        };
      }

      // Check cache
      const cached = globalCache.get(cacheKey);
      if (cached) {
        return {
          ...cached,
          cached: true,
          cacheAge: Date.now() - cached.timestamp,
        };
      }

      // Execute handler
      const response = await handler(request);

      // Cache successful responses
      if (!response.error) {
        const dataToCache = {
          ...response,
          timestamp: Date.now(),
        };
        globalCache.set(cacheKey, dataToCache, ttl);
      }

      return response;
    } catch (error) {
      throw error;
    }
  };
}

/**
 * Batch multiple requests to reduce query count
 */
export class RequestBatcher {
  constructor(maxBatchSize = 10, maxWaitMs = 100) {
    this.maxBatchSize = maxBatchSize;
    this.maxWaitMs = maxWaitMs;
    this.batches = new Map();
  }

  /**
   * Add request to batch
   */
  async add(key, queryFn) {
    if (!this.batches.has(key)) {
      this.batches.set(key, {
        requests: [],
        timeout: null,
      });
    }

    const batch = this.batches.get(key);

    return new Promise((resolve, reject) => {
      batch.requests.push({ queryFn, resolve, reject });

      // Execute if batch is full
      if (batch.requests.length >= this.maxBatchSize) {
        this.executeBatch(key);
      } else if (!batch.timeout) {
        // Set timeout to execute batch
        batch.timeout = setTimeout(() => {
          this.executeBatch(key);
        }, this.maxWaitMs);
      }
    });
  }

  /**
   * Execute batched requests
   */
  async executeBatch(key) {
    const batch = this.batches.get(key);
    if (!batch || batch.requests.length === 0) return;

    this.batches.delete(key);
    if (batch.timeout) clearTimeout(batch.timeout);

    // Execute all queries in parallel
    const results = await Promise.allSettled(
      batch.requests.map((req) => req.queryFn())
    );

    // Resolve/reject individual promises
    results.forEach((result, index) => {
      const request = batch.requests[index];
      if (result.status === 'fulfilled') {
        request.resolve(result.value);
      } else {
        request.reject(result.reason);
      }
    });
  }
}

// Export singleton cache instance
export default globalCache;

/**
 * Helper to invalidate cache by pattern
 */
export function invalidateCacheByPattern(pattern) {
  for (const key of globalCache.cache.keys()) {
    if (key.includes(pattern)) {
      globalCache.cache.delete(key);
    }
  }
}

/**
 * Helper to get cache statistics
 */
export function getCacheStats() {
  return globalCache.getStats();
}

/**
 * Helper to clear all cache
 */
export function clearCache() {
  globalCache.clear();
}
