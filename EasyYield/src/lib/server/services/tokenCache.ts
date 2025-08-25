// src/server/services/tokenCache.ts
export type TokenMetadata = {
  address: string;         // resource address (lowercased key)
  symbol: string;
  name: string;
  iconUrl?: string;
  decimals: number;
};

type FetchSingle = (address: string) => Promise<TokenMetadata | null>;
type FetchMany = (addresses: string[]) => Promise<Record<string, TokenMetadata | null>>;

export class TokenCache {
  private cache = new Map<string, TokenMetadata>(); // key: lowercased resource address

  constructor(
    private fetchSingleToken?: FetchSingle,
    private fetchManyTokens?: FetchMany
  ) {}

  // Normalize key
  private key(addr: string) {
    return addr.toLowerCase();
  }

  // Get from cache
  get(address: string): TokenMetadata | undefined {
    return this.cache.get(this.key(address));
  }

  // Put into cache
  set(meta: TokenMetadata) {
    this.cache.set(this.key(meta.address), { ...meta, address: this.key(meta.address) });
  }

  // Put many
  setMany(entries: TokenMetadata[]) {
    for (const e of entries) this.set(e);
  }

  // Resolve an array of resource addresses using cache-first, then fetch misses, update cache, and return in input order
  async resolve(addresses: string[]): Promise<(TokenMetadata | null)[]> {
    if (!addresses.length) return [];

    const keys = addresses.map(a => this.key(a));
    const results: (TokenMetadata | null)[] = new Array(keys.length).fill(null);

    // 1) read cache
    const misses: string[] = [];
    keys.forEach((k, i) => {
      const cached = this.cache.get(k);
      if (cached) {
        results[i] = cached;
      } else {
        misses.push(k);
      }
    });

    if (misses.length === 0) return results;

    // 2) fetch misses (prefer batch fetch if provided)
    if (this.fetchManyTokens) {
      const fetched = await this.fetchManyTokens(misses);
      // Save to cache and fill results
      keys.forEach((k, i) => {
        if (results[i]) return; // already from cache
        const meta = fetched[k] ?? null;
        if (meta) this.set(meta);
        results[i] = meta;
      });
    } else if (this.fetchSingleToken) {
      // Fallback: fetch sequentially or in small parallel batches
      const fetchedMap: Record<string, TokenMetadata | null> = {};
      for (const k of misses) {
        fetchedMap[k] = await this.fetchSingleToken(k);
        if (fetchedMap[k]) this.set(fetchedMap[k]!);
      }
      keys.forEach((k, i) => {
        if (!results[i]) results[i] = fetchedMap[k] ?? null;
      });
    } else {
      // No fetchers configured; return cache-only results
      // Misses remain null
    }

    return results;
  }
}
