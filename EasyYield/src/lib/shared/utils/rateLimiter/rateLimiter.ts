interface RateLimitState {
  requests: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitState> = new Map();

  async waitForRateLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<void> {
    const now = Date.now();
    const state = this.limits.get(key) || {
      requests: 0,
      resetTime: now + windowMs,
    };

    // Reset window if time has passed
    if (now >= state.resetTime) {
      state.requests = 0;
      state.resetTime = now + windowMs;
    }

    // If we've hit the limit, wait until reset
    if (state.requests >= maxRequests) {
      const waitTime = state.resetTime - now;
      console.log(
        `[RATE_LIMIT] Waiting ${waitTime}ms for ${key} rate limit reset`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      // Reset after waiting
      state.requests = 0;
      state.resetTime = Date.now() + windowMs;
    }

    // Increment request count
    state.requests++;
    this.limits.set(key, state);
  }

  getStatus(key: string): { requests: number; resetTime: number } | null {
    return this.limits.get(key) || null;
  }
}

export const rateLimiter = new RateLimiter();
