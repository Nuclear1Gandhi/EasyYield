// src/server/utils/dappDefinitionFetcher.ts - Enhanced version
const RADIX_API_URL =
  process.env.NETWORK_NAME === 'stokenet'
    ? 'https://stokenet.radixapi.net/v1'
    : 'https://api.radixapi.net/v1';

interface DappDefinition {
  address: string;
  name?: string;
  description?: string;
  icon_url?: string;
  website?: string;
  [key: string]: any;
}

type DappDefinitionsResponse =
  | {
      success: true;
      definitions: DappDefinition[];
    }
  | {
      success: false;
      error: any;
    };

export const getEntityDappDefinitions =
  async (): Promise<DappDefinitionsResponse> => {
    try {
      const response = await fetch(`${RADIX_API_URL}/entity/dapp_definitions`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${process.env.RADIX_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();

      if (data.code === 200) {
        return { success: true, definitions: data.data };
      }

      return { success: false, error: data };
    } catch (error) {
      console.error('Error fetching dApp definitions:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'getEntityDappDefinitions: runtime error',
      };
    }
  };

// ✅ Enhanced cache with better error handling
let dappDefinitionsCache: DappDefinition[] | null = null;
let cacheTimestamp = 0;
let cacheError: string | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export const getCachedDappDefinitions = async (): Promise<DappDefinition[]> => {
  const now = Date.now();

  // Return cached data if still valid
  if (dappDefinitionsCache && now - cacheTimestamp < CACHE_DURATION) {
    console.log(
      `[CACHE] Using cached dApp definitions (${dappDefinitionsCache.length} items)`
    );
    return dappDefinitionsCache;
  }

  console.log('[CACHE] Fetching fresh dApp definitions...');

  const result = await getEntityDappDefinitions();
  if (result.success) {
    dappDefinitionsCache = result.definitions;
    cacheTimestamp = now;
    cacheError = null;
    console.log(`[CACHE] Cached ${result.definitions.length} dApp definitions`);
    return result.definitions;
  } else {
    cacheError =
      typeof result.error === 'string'
        ? result.error
        : JSON.stringify(result.error);
    console.error('[CACHE] Failed to fetch dApp definitions:', cacheError);

    // Return stale cache if available
    if (dappDefinitionsCache) {
      console.log('[CACHE] Returning stale cached data due to error');
      return dappDefinitionsCache;
    }

    // No cache available, throw error
    throw new Error(`Failed to fetch dApp definitions: ${cacheError}`);
  }
};

// ✅ Helper functions using cached data
export const findDappByName = async (
  searchName: string
): Promise<DappDefinition | null> => {
  try {
    const dapps = await getCachedDappDefinitions();
    const found = dapps.find(
      (dapp) =>
        dapp.name?.toLowerCase().includes(searchName.toLowerCase()) ||
        dapp.description?.toLowerCase().includes(searchName.toLowerCase())
    );
    return found || null;
  } catch (error) {
    console.error('Failed to search for dApp:', error);
    return null;
  }
};

export const findMultipleDapps = async (
  searchNames: string[]
): Promise<Record<string, DappDefinition | null>> => {
  const results: Record<string, DappDefinition | null> = {};

  try {
    const dapps = await getCachedDappDefinitions();

    searchNames.forEach((searchName) => {
      const found = dapps.find(
        (dapp) =>
          dapp.name?.toLowerCase().includes(searchName.toLowerCase()) ||
          dapp.description?.toLowerCase().includes(searchName.toLowerCase())
      );
      results[searchName] = found || null;
    });
  } catch (error) {
    console.error('Failed to search for dApps:', error);
    searchNames.forEach((name) => (results[name] = null));
  }

  return results;
};

// ✅ Cache status for debugging
export const getCacheStatus = () => ({
  cached: !!dappDefinitionsCache,
  count: dappDefinitionsCache?.length || 0,
  age: dappDefinitionsCache ? Date.now() - cacheTimestamp : 0,
  error: cacheError,
});
