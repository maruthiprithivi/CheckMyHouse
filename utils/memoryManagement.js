/**
 * Memory management utilities for handling large datasets
 */

/**
 * Simple LRU Cache implementation
 */
export class LRUCache {
  constructor(maxSize = 50) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    // Move to end (most recently used)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);

    return value;
  }

  set(key, value) {
    // Delete if exists to re-add at end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add to end
    this.cache.set(key, value);

    // Evict oldest if over size
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Time-based cache with TTL
 */
export class TTLCache {
  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttl = ttlMs;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }

  clear() {
    this.cache.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Sample data for charts (reduce data points)
 */
export function sampleData(data, maxPoints = 200) {
  if (!data || data.length <= maxPoints) return data;

  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, index) => index % step === 0);
}

/**
 * Chunk large arrays for processing
 */
export function* chunkArray(array, chunkSize = 100) {
  for (let i = 0; i < array.length; i += chunkSize) {
    yield array.slice(i, i + chunkSize);
  }
}

/**
 * Debounce function calls
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 */
export function throttle(func, limit = 1000) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if browser memory is getting low
 */
export function checkMemoryPressure() {
  if (typeof performance === 'undefined' || !performance.memory) {
    return { pressure: 'unknown', percentage: 0 };
  }

  const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
  const percentage = (usedJSHeapSize / jsHeapSizeLimit) * 100;

  let pressure = 'low';
  if (percentage > 90) pressure = 'critical';
  else if (percentage > 75) pressure = 'high';
  else if (percentage > 50) pressure = 'moderate';

  return {
    pressure,
    percentage,
    usedMB: (usedJSHeapSize / 1048576).toFixed(2),
    limitMB: (jsHeapSizeLimit / 1048576).toFixed(2),
  };
}

/**
 * Memory monitor (for development)
 */
export function startMemoryMonitor(intervalMs = 10000) {
  if (typeof performance === 'undefined' || !performance.memory) {
    console.log('Memory monitoring not available');
    return null;
  }

  const interval = setInterval(() => {
    const memory = checkMemoryPressure();
    console.log(`[Memory] ${memory.usedMB}MB / ${memory.limitMB}MB (${memory.percentage.toFixed(1)}%) - ${memory.pressure}`);
  }, intervalMs);

  return () => clearInterval(interval);
}

/**
 * Paginate array
 */
export function paginate(array, page = 1, pageSize = 100) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: array.slice(start, end),
    page,
    pageSize,
    total: array.length,
    totalPages: Math.ceil(array.length / pageSize),
    hasNext: end < array.length,
    hasPrev: page > 1,
  };
}

/**
 * Lazy load data in batches
 */
export async function* lazyLoadData(fetchFunction, batchSize = 100) {
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const batch = await fetchFunction(offset, batchSize);
    if (batch.length === 0 || batch.length < batchSize) {
      hasMore = false;
    }
    yield batch;
    offset += batchSize;
  }
}
