interface CacheEntry {
  value: string;
  timestamp: number;
  ttl: number;
}

class ResourceNameCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours

  set(key: string, value: string, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  getMultiple(keys: string[]): Map<string, string> {
    const results = new Map<string, string>();
    keys.forEach((key) => {
      const value = this.get(key);
      if (value) results.set(key, value);
    });
    return results;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const resourceCache = new ResourceNameCache();

// Cleanup every hour
setInterval(() => resourceCache.cleanup(), 60 * 60 * 1000);
