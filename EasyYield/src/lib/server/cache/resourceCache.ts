interface CacheEntry {
  value: string;
  timestamp: number;
  ttl: number;
}

class ResourceCache {
  private cache = new Map<string, CacheEntry>();
  private pendingRequests = new Map<string, Promise<string>>(); // Add this line
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

  // NEW: Add promise-based resolution with memoization
  async resolve(key: string, fetcher: () => Promise<string>): Promise<string> {
    // Return cached value if available
    const cached = this.get(key);
    if (cached) {
      return cached;
    }

    // Return pending promise if request is already in flight
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Create new request promise
    const requestPromise = this.executeRequest(key, fetcher);
    this.pendingRequests.set(key, requestPromise);

    return requestPromise;
  }

  private async executeRequest(
    key: string,
    fetcher: () => Promise<string>
  ): Promise<string> {
    try {
      const value = await fetcher();
      // Cache the resolved value
      this.set(key, value);
      // Remove from pending requests
      this.pendingRequests.delete(key);
      return value;
    } catch (error) {
      // Remove failed request from pending
      this.pendingRequests.delete(key);

      // Cache a fallback value to avoid repeated failures
      const fallback = this.createFallbackSymbol(key);
      this.set(key, fallback, 60 * 60 * 1000); // Cache fallback for 1 hour
      return fallback;
    }
  }

  private createFallbackSymbol(address: string): string {
    return `TOKEN_${address.slice(13, 20).toUpperCase()}`;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // NEW: Get cache stats for debugging
  getStats() {
    return {
      cached: this.cache.size,
      pending: this.pendingRequests.size,
    };
  }
}

export const resourceCache = new ResourceCache();

// Cleanup every hour
setInterval(() => resourceCache.cleanup(), 60 * 60 * 1000);
