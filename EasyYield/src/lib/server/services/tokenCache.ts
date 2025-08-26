export type TokenMetadata = {
  address: string; // resource address (lowercased key)
  symbol: string;
  name: string;
  iconUrl?: string;
  decimals: number;
};

type FetchSingle = (address: string) => Promise<TokenMetadata | null>;
type FetchMany = (
  addresses: string[]
) => Promise<Record<string, TokenMetadata | null>>;

export class TokenCache {
  private cache = new Map<string, TokenMetadata>(); // key: lowercased resource address

  constructor(private fetchTokens: FetchMany) {}

  // Get from cache
  get(address: string): TokenMetadata | undefined {
    return this.cache.get(address);
  }

  // Put into cache
  set(meta: TokenMetadata) {
    this.cache.set(meta.address, { ...meta, address: meta.address });
  }

  // Put many
  setMany(entries: TokenMetadata[]) {
    for (const e of entries) this.set(e);
  }

  // Resolve an array of resource addresses using cache-first, then fetch misses, update cache, and return in input order
  async resolve(addresses: string[]): Promise<(TokenMetadata | null)[]> {
    if (!addresses.length) return [];

    const results: (TokenMetadata | null)[] = new Array(addresses.length).fill(
      null
    );

    // 1) read cache
    const misses: string[] = [];
    addresses.forEach((k, i) => {
      const cached = this.cache.get(k);
      if (cached) {
        results[i] = cached;
      } else {
        misses.push(k);
      }
    });

    if (misses.length === 0) return results;

    // 2) fetch misses (prefer batch fetch if provided)
    const fetched = await this.fetchTokens(misses);
    // Save to cache and fill results
    addresses.forEach((k, i) => {
      if (results[i]) return; // already from cache
      const meta = fetched[k] ?? null;
      if (meta) this.set(meta);
      results[i] = meta;
    });
    return results;
  }
}
