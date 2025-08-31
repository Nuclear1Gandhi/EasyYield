import redis from "$client/services/redis";

const PRICE_CACHE_KEY = 'coingecko_prices';
const CACHE_TTL = 3600; // 1 hour in seconds
const API_KEY = process.env.COINGECKO_API_KEY;

interface PriceResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change?: number;
  };
}

/**
 * Fetch USD prices for tokens using CoinGecko's simple/price endpoint
 * Handles both coin IDs (e.g., 'bitcoin') and contract addresses
 */
export async function fetchPrices(identifiers: string[]): Promise<Record<string, number>> {
  const cached = await getCachedPrices(identifiers);
  const result: Record<string, number> = { ...cached };
  
  // Find identifiers that need fetching
  const toFetch = identifiers.filter(id => !(id.toLowerCase() in result));
  
  if (toFetch.length === 0) {
    console.log(`[PRICE] All ${identifiers.length} prices served from cache`);
    return result;
  }

  console.log(`[PRICE] Fetching ${toFetch.length} prices from CoinGecko API`);

  try {
    // Batch fetch in chunks of 250 (CoinGecko limit)
    const chunks = chunkArray(toFetch, 250);
    
    for (const chunk of chunks) {
      const prices = await fetchPriceChunk(chunk);
      Object.assign(result, prices);
    }

    // Cache the new prices
    await cachePrices(result);
    
    console.log(`[PRICE] Successfully fetched ${Object.keys(result).length} prices`);
    return result;
    
  } catch (error: any) {
    console.error('[PRICE] Error fetching from CoinGecko:', error);
    throw new Error(`Failed to fetch prices: ${error.message}`);
  }
}

/**
 * Fetch a single chunk of prices from CoinGecko
 */
async function fetchPriceChunk(identifiers: string[]): Promise<Record<string, number>> {
  const isContractAddress = (id: string) => id.startsWith('0x') || id.length > 20;
  
  // Separate contract addresses from coin IDs
  const coinIds = identifiers.filter(id => !isContractAddress(id));
  const contractAddresses = identifiers.filter(id => isContractAddress(id));
  
  const result: Record<string, number> = {};
  
  // Fetch coin IDs using simple/price
  if (coinIds.length > 0) {
    const coinUrl = `${process.env.COINGECKO_BASE_URL}/simple/price`;
    const coinParams = new URLSearchParams({
      ids: coinIds.join(','),
      vs_currencies: 'usd',
      include_24hr_change: 'false'
    });
    
    if (API_KEY) {
      coinParams.append('x_cg_demo_api_key', API_KEY);
    }

    const coinResponse = await fetch(`${coinUrl}?${coinParams}`);
    
    if (!coinResponse.ok) {
      throw new Error(`CoinGecko API error: ${coinResponse.status} ${coinResponse.statusText}`);
    }
    
    const coinData: PriceResponse = await coinResponse.json();
    
    for (const [coinId, priceData] of Object.entries(coinData)) {
      result[coinId.toLowerCase()] = priceData.usd;
    }
  }
  
  // Fetch contract addresses using simple/token_price (if needed)
  if (contractAddresses.length > 0) {
    console.warn('[PRICE] Contract address pricing not implemented yet');
    // TODO: Implement contract address pricing when needed
  }
  
  return result;
}

/**
 * Get cached prices from Redis
 */
async function getCachedPrices(identifiers: string[]): Promise<Record<string, number>> {
  try {
    const keys = identifiers.map(id => id.toLowerCase());
    const cached = await redis.hmget(PRICE_CACHE_KEY, ...keys);
    
    const result: Record<string, number> = {};
    keys.forEach((key, index) => {
      if (cached[index]) {
        result[key] = parseFloat(cached[index]);
      }
    });
    
    return result;
  } catch (error) {
    console.warn('[PRICE] Redis cache read failed:', error);
    return {};
  }
}

/**
 * Cache prices in Redis with TTL
 */
async function cachePrices(prices: Record<string, number>): Promise<void> {
  try {
    const pipeline = redis.multi();
    
    for (const [identifier, price] of Object.entries(prices)) {
      pipeline.hset(PRICE_CACHE_KEY, identifier.toLowerCase(), price.toString());
    }
    
    pipeline.expire(PRICE_CACHE_KEY, CACHE_TTL);
    await pipeline.exec();
    
    console.log(`[PRICE] Cached ${Object.keys(prices).length} prices for ${CACHE_TTL}s`);
  } catch (error) {
    console.warn('[PRICE] Redis cache write failed:', error);
  }
}

/**
 * Utility function to chunk arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Map common token symbols to CoinGecko IDs
 * You'll expand this based on your supported tokens
 */
export const SYMBOL_TO_COINGECKO_ID: Record<string, string> = {
  'XRD': 'radix',
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDC': 'usd-coin',
  'USDT': 'tether',
  'GAB': 'gab-ai', // Example - verify actual CoinGecko ID
  // Add more mappings as needed
};

/**
 * Convert token symbols to CoinGecko IDs for price lookup
 */
export function symbolsToCoingeckoIds(symbols: string[]): string[] {
  return symbols.map(symbol => {
    const id = SYMBOL_TO_COINGECKO_ID[symbol.toUpperCase()];
    if (!id) {
      console.warn(`[PRICE] No CoinGecko ID mapping for symbol: ${symbol}`);
      return symbol.toLowerCase(); // Fallback to lowercase symbol
    }
    return id;
  });
}
