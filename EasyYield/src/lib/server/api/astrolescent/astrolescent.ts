import { TokenPriceCache } from '$server/mongo/models/TokenPriceCache';
import type { AstrolescentPricesResponse } from '$shared/typings/Astrolescent';

const ASTROLESCENT_API_BASE = 'https://api.astrolescent.com/partner';
const PRICE_STALE_MS = 15 * 60 * 1000; // 15 minutes stale threshold

async function getCachedRadixPrices(
  addresses: string[]
): Promise<Record<string, number>> {
  if (addresses.length === 0) return {};

  const cutoff = new Date(Date.now() - PRICE_STALE_MS);
  const lowerAddresses = addresses.map((addr) => addr.toLowerCase());

  const freshEntries = await TokenPriceCache.find({
    address: { $in: lowerAddresses },
    lastUpdated: { $gte: cutoff },
  }).exec();

  const cached: Record<string, number> = {};
  for (const entry of freshEntries) {
    cached[entry.address] = entry.priceUSD;
  }

  return cached;
}

async function cacheRadixPrices(prices: Record<string, number>): Promise<void> {
  const now = new Date();
  const bulkOps = Object.entries(prices).map(([address, price]) => ({
    updateOne: {
      filter: { address: address.toLowerCase() },
      update: { priceUSD: price, lastUpdated: now },
      upsert: true,
    },
  }));

  if (bulkOps.length === 0) return;

  try {
    await TokenPriceCache.bulkWrite(bulkOps);
    console.log(
      `[RADIX-PRICE] Cached ${bulkOps.length} token prices in MongoDB`
    );
  } catch (error: any) {
    console.warn('[RADIX-PRICE] MongoDB price cache write failed:', error);
  }
}

// ----------------------
// Astrolescent API fetch functions
// ----------------------

// Fetch all Radix token prices from Astrolescent API
async function fetchAllRadixPricesFromAstrolescentAPI(): Promise<AstrolescentPricesResponse> {
  if (!process.env.ASTROLESCENT_API_KEY) {
    throw new Error('ASTROLESCENT_API_KEY environment variable not set');
  }

  const url = `${ASTROLESCENT_API_BASE}/${process.env.ASTROLESCENT_API_KEY}/prices`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'EasyYield/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Astrolescent prices API error: ${response.status} ${response.statusText}`
    );
  }

  const prices: AstrolescentPricesResponse = await response.json();

  console.log(
    `[RADIX-PRICE] Retrieved prices for ${Object.keys(prices).length} Radix tokens from Astrolescent`
  );

  return prices;
}

// Fetch only requested token prices from the full price list
async function fetchAstrolescentPricesAPI(
  tokenAddresses: string[]
): Promise<Record<string, number>> {
  if (tokenAddresses.length === 0) return {};

  const allPrices = await fetchAllRadixPricesFromAstrolescentAPI();

  const newPrices: Record<string, number> = {};
  for (const addr of tokenAddresses) {
    const priceData = allPrices[addr];
    const priceUSD = priceData?.tokenPriceUSD || 0;
    newPrices[addr.toLowerCase()] = priceUSD;
    if (priceUSD > 0) {
      console.log(
        `[RADIX-PRICE] ${priceData?.symbol || 'UNKNOWN'}: $${priceUSD.toFixed(4)}`
      );
    }
  }
  return newPrices;
}

// ----------------------
// Main public function
// ----------------------

/**
 * Fetch USD prices for Radix token addresses using Astrolescent API with MongoDB caching.
 * @param tokenAddresses Array of Radix token resource addresses.
 * @returns Record mapping token addresses (lowercase) to USD price numbers.
 */
export async function fetchAstrolescentPrices(
  tokenAddresses: string[]
): Promise<Record<string, number>> {
  if (tokenAddresses.length === 0) return {};

  console.log(
    `[RADIX-PRICE] Fetching prices for ${tokenAddresses.length} Radix tokens`
  );

  // 1. Get fresh cached prices from MongoDB
  const cachedPrices = await getCachedRadixPrices(tokenAddresses);
  const result: Record<string, number> = { ...cachedPrices };

  // 2. Identify tokens missing or stale in cache
  const needFetching = tokenAddresses.filter(
    (addr) => !(addr.toLowerCase() in result)
  );

  if (needFetching.length === 0) {
    console.log(`[RADIX-PRICE] All prices served from MongoDB cache`);
    return result;
  }

  try {
    // 3. Fetch prices for missing tokens via API
    const newlyFetchedPrices = await fetchAstrolescentPricesAPI(needFetching);

    // 4. Merge fetched prices
    Object.assign(result, newlyFetchedPrices);

    // 5. Cache fetched prices in MongoDB
    await cacheRadixPrices(newlyFetchedPrices);

    return result;
  } catch (error: any) {
    console.error(
      '[RADIX-PRICE] Error fetching prices from Astrolescent:',
      error
    );

    // On error, fill missing with zeros
    needFetching.forEach((addr) => {
      result[addr.toLowerCase()] = 0;
    });

    return result;
  }
}
