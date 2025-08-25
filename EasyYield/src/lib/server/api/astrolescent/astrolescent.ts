import redis from "$client/services/redis";

const ASTROLESCENT_API_BASE = 'https://api.astrolescent.com/partner';
const RADIX_PRICE_CACHE_KEY = 'radix_token_prices';
const PRICE_CACHE_TTL = 600; // 10 minutes


interface RadixTokenPrice {
  address: string;
  symbol: string;
  name: string;
  tokenPriceUSD: number;
  tokenPriceXRD: number;
  diff24H: number;
  diff24HUSD: number;
  diff7Days: number;
  diff7DaysUSD: number;
}

type RadixPricesResponse = Record<string, RadixTokenPrice>;

/**
 * Fetch USD prices for Radix token addresses using Astrolescent
 * ONLY used for pricing, not metadata
 */
export async function fetchRadixTokenPrices(tokenAddresses: string[]): Promise<Record<string, number>> {
  if (tokenAddresses.length === 0) return {};

  console.log(`[RADIX-PRICE] Fetching prices for ${tokenAddresses.length} Radix tokens`);
  // 1. Check Redis cache first
  const cached = await getCachedRadixPrices(tokenAddresses);
  const result: Record<string, number> = { ...cached };
  
  try {
    
    // 2. Find uncached addresses
    const needFetching = tokenAddresses.filter(addr => 
      !(addr.toLowerCase() in result)
    );
    
    if (needFetching.length === 0) {
      console.log(`[RADIX-PRICE] All ${tokenAddresses.length} prices served from cache`);
      return result;
    }

    // 3. Fetch all current prices from Astrolescent
    const allPrices = await fetchAllRadixPrices();
    
    // 4. Extract prices for requested tokens
    const newPrices: Record<string, number> = {};
    for (const address of tokenAddresses) {
      const priceData = allPrices[address];
      const usdPrice = priceData?.tokenPriceUSD || 0;
      
      result[address.toLowerCase()] = usdPrice;
      newPrices[address.toLowerCase()] = usdPrice;
      
      if (usdPrice > 0) {
        console.log(`[RADIX-PRICE] ${priceData?.symbol || 'UNKNOWN'}: $${usdPrice.toFixed(4)}`);
      }
    }
    
    // 5. Cache the new prices
    await cacheRadixPrices(newPrices);
    
    return result;
    
  } catch (error: any) {
    console.error('[RADIX-PRICE] Error fetching Astrolescent prices:', error);
    
    // Return cached values + zeros for failures
    tokenAddresses.forEach(addr => {
      if (!(addr.toLowerCase() in result)) {
        result[addr.toLowerCase()] = 0;
      }
    });
    
    return result;
  }
}

/**
 * Fetch all Radix token prices from Astrolescent API
 */
async function fetchAllRadixPrices(): Promise<RadixPricesResponse> {
  if (!process.env.ASTROLESCENT_API_KEY) {
    throw new Error('ASTROLESCENT_API_KEY environment variable not set');
  }
  
  const url = `${ASTROLESCENT_API_BASE}/${process.env.ASTROLESCENT_API_KEY}/prices`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'EasyYield/1.0'
    },
  });
  
  if (!response.ok) {
    throw new Error(`Astrolescent prices API error: ${response.status} ${response.statusText}`);
  }
  
  const prices: RadixPricesResponse = await response.json();
  
  console.log(`[RADIX-PRICE] Retrieved prices for ${Object.keys(prices).length} Radix tokens from Astrolescent`);
  
  return prices;
}

// Cache functions remain the same...
async function getCachedRadixPrices(addresses: string[]): Promise<Record<string, number>> {
  try {
    const keys = addresses.map(addr => addr.toLowerCase());
    const cached = await redis.hmget(RADIX_PRICE_CACHE_KEY, ...keys);
    
    const result: Record<string, number> = {};
    keys.forEach((key, index) => {
      if (cached[index]) {
        result[key] = parseFloat(cached[index]);
      }
    });
    
    return result;
  } catch (error: any) {
    console.warn('[RADIX-PRICE] Redis cache read failed:', error);
    return {};
  }
}

async function cacheRadixPrices(prices: Record<string, number>): Promise<void> {
  if (Object.keys(prices).length === 0) return;
  
  try {
    const pipeline = redis.multi();
    
    for (const [address, price] of Object.entries(prices)) {
      pipeline.hset(RADIX_PRICE_CACHE_KEY, address.toLowerCase(), price.toString());
    }
    
    pipeline.expire(RADIX_PRICE_CACHE_KEY, PRICE_CACHE_TTL);
    await pipeline.exec();
    
    console.log(`[RADIX-PRICE] Cached ${Object.keys(prices).length} prices for ${PRICE_CACHE_TTL}s`);
  } catch (error: any) {
    console.warn('[RADIX-PRICE] Redis cache write failed:', error);
  }
}
