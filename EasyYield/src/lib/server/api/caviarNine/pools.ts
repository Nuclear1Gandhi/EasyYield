import { RadixGatewayClient } from '$server/api/gateway/gatewayClient';
import { makeRateLimitedRequest } from '$shared/utils/rateLimiter/makeRateLimitedRequest';
import { BigNumber } from 'bignumber.js';
import {
  CAVIARNINE_HYPERSTAKE_ADDRESS,
  CAVIARNINE_LSU_POOL_ADDRESS,
} from '$lib/constants';
import { CAVIARNINE_API_CONFIG, CAVIARNINE_CORE_API_URL } from './constants';
import type { CaviarNineTicker, FeeVault, FeeVaultsResponse, RawCaviarNineHyperstakePool } from '$shared/typings/CaviarNine';
import type { RawPoolData } from '$server/services/source/rawDataExtractor';
import { CaviarNinePoolType, Dapps, YieldSourceType } from '$shared/typings/YieldSource';
import { tokenCache } from '$server/jobs/updateYieldSources/tokenCacheInstance';



/**
 * Convert HyperStake pool to unified format
 */
function convertHyperStakeToUnified(
  hyperStakePool: RawCaviarNineHyperstakePool
): RawPoolData | null {
  if (!hyperStakePool || hyperStakePool.tokens.length < 2) {
    return null;
  }

  return {
    dapp: Dapps.CAVIARNINE,
    poolId: hyperStakePool.poolId,
    name: hyperStakePool.name,
    type: YieldSourceType.HYPERSTAKE, // or create YieldSourceType.HYPERSTAKE
    tokens: hyperStakePool.tokens.map(token => ({
      address: token.address,
      symbol: token.symbol || 'UNKNOWN',
      amount: token.amount,
      decimals: token.decimals,
    })),
    rawData: {
      poolType: YieldSourceType.HYPERSTAKE,
      originalData: hyperStakePool,
      hasVault: hyperStakePool.hasVault,
      vaultAddress: hyperStakePool.vaultAddress,
    },
  };
}

/**
 * Convert LSU pool to unified format
 */
function convertLSUPoolToUnified(
  lsuPool: RawCaviarNineHyperstakePool
): RawPoolData | null {
  if (!lsuPool || lsuPool.tokens.length === 0) {
    return null;
  }

  // Ensure we have at least 2 tokens for consistency
  const tokens = [...lsuPool.tokens];
  while (tokens.length < 2) {
    tokens.push({
      address: `placeholder_${tokens.length}`,
      symbol: 'PLACEHOLDER',
      amount: '0',
      decimals: 18,
    });
  }

  return {
    dapp: Dapps.CAVIARNINE,
    poolId: lsuPool.poolId,
    name: lsuPool.name,
    type: YieldSourceType.LSU_POOL,
    tokens: tokens.map(token => ({
      address: token.address,
      symbol: token.symbol || 'UNKNOWN',
      amount: token.amount,
      decimals: token.decimals,
    })),
    rawData: {
      poolType: 'LSU_POOL',
      originalData: lsuPool,
      hasVault: lsuPool.hasVault,
    },
  };
}

export async function getCaviarNineRawData(): Promise<RawPoolData[]> {
  try {
    // Fetch all data sources in parallel
    const [
      tickersResult,
      feeVaultsResult,
      // hyperStakeResult,
      // lsuPoolResult,
    ] = await Promise.allSettled([
      fetchCaviarNineTickers(),
      fetchCaviarNineFeeVaults(),
      // fetchCaviarNineHyperStakeRaw(),
      // fetchCaviarNineLSUPoolRaw(),
    ]);
    
    const rawPools: RawPoolData[] = [];
    
    // Process tickers
    if (tickersResult.status === 'fulfilled' && feeVaultsResult.status === 'fulfilled') {
      const tickerPools = await processTickersToUnified(
        tickersResult.value.tickers,
        feeVaultsResult.value 
      );
      rawPools.push(...tickerPools);
    }

    // Process HyperStake
    // if (hyperStakeResult.status === 'fulfilled' && hyperStakeResult.value) {
    //   const hyperStakePool = convertHyperStakeToUnified(hyperStakeResult.value);
    //   if (hyperStakePool) {
    //     rawPools.push(hyperStakePool);
    //   }
    // }

    // Process LSU Pool
    // if (lsuPoolResult.status === 'fulfilled' && lsuPoolResult.value) {
    //   const lsuPool = convertLSUPoolToUnified(lsuPoolResult.value);
    //   if (lsuPool) {
    //     rawPools.push(lsuPool);
    //   }
    // }
    
    console.log(`[CAVIAR-EXTRACT] Successfully extracted ${rawPools.length} unified pools`);
    return rawPools;
    
  } catch (error) {
    console.error('[CAVIAR-EXTRACT] Failed to extract raw data:', error);
    throw error;
  }
}

/**
 * Fetch ticker data from CaviarNine API
 */
async function fetchCaviarNineTickers() {
  const tickers = await makeRateLimitedRequest<CaviarNineTicker[]>(
    `${CAVIARNINE_CORE_API_URL}/cg/tickers`,
    'CaviarNine tickers',
    CAVIARNINE_API_CONFIG
  );
  
  return { tickers };
}

/**
 * Fetch fee vault data from CaviarNine API
 */
async function fetchCaviarNineFeeVaults() {
  return await makeRateLimitedRequest<FeeVaultsResponse>(
    `${CAVIARNINE_CORE_API_URL}/fee_vaults`,
    'CaviarNine fee vaults',
    CAVIARNINE_API_CONFIG
  );
}

/**
 * Process ticker data into unified RawPoolData format
*/
async function processTickersToUnified(
  tickers: CaviarNineTicker[],
  feeVaultsData: FeeVaultsResponse | null
): Promise<RawPoolData[]> {
  const rawPools: RawPoolData[] = [];


  const poolReserves = await fetchPoolReserves(tickers.map((t) => t.pool_id))
  
  for (const ticker of tickers) {
    try {
      const rawPool = await processTickerToUnified(ticker, poolReserves);
      if (rawPool) {
        rawPools.push(rawPool);
      }
    } catch (error) {
      console.warn(`[CAVIAR-RAW] Failed to process ticker ${ticker.pool_id}:`, error);
    }
  }
  
  return rawPools;
}

/**
 * Convert single ticker to unified RawPoolData format
 */
async function processTickerToUnified(
  ticker: CaviarNineTicker,
  feeVaultsData: FeeVaultsResponse | null
): Promise<RawPoolData | null> {
  // Basic validation
  if (!ticker.pool_id || !ticker.base_currency || !ticker.target_currency) {
    return null;
  }

  // Get vault information
  const matchingVault = feeVaultsData?.data?.find(
    (v: FeeVault) => v.component_address === ticker.pool_id
  );
  const hasVault = !!matchingVault;
  
  // Create unified token format
  const tokens = [
    {
      address: ticker.base_currency,
      symbol: hasVault ? (matchingVault?.base_resource_symbol || 'UNKNOWN') : 'UNKNOWN',
      amount: reserves.baseAmount || '0',
      decimals: reserves.baseDecimals || 18,
    },
    {
      address: ticker.target_currency,
      symbol: hasVault ? (matchingVault?.vault_resource_symbol || 'UNKNOWN') : 'UNKNOWN',
      amount: reserves.quoteAmount || '0',
      decimals: reserves.quoteDecimals || 18,
    },
  ];
  return {
    dapp: Dapps.CAVIARNINE,
    poolId: ticker.pool_id,
    name: hasVault 
      ? `${tokens[0].symbol}/${tokens[1].symbol}`
      : ticker.ticker_id || ticker.pool_id.slice(-8),
    type: YieldSourceType.DEX_PAIR,
    tokens,
    rawData: {
      poolType: CaviarNinePoolType.INDEX_POOL,
      ticker,
      vault: matchingVault,
      hasVault,
      vaultAddress: matchingVault?.component_address,
      //todo
      swapFee: matchingVault?.fee_percentage?.toString() || '0.3',
    },
  };
}

/**
 * Fetch HyperStake raw data
 */
async function fetchCaviarNineHyperStakeRaw(): Promise<RawCaviarNineHyperstakePool | null> {
  try {
    const gatewayClient = RadixGatewayClient.getInstance();
    
    // Get component metadata
    const entity = await gatewayClient.state.getEntityDetailsVaultAggregated(
      CAVIARNINE_HYPERSTAKE_ADDRESS,
      {
        explicitMetadata: ['resource_x', 'resource_y', 'pool_component'],
      }
    );

    const metadata = entity?.metadata?.items || [];
    const metadataMap = metadata.reduce((acc: any, item) => {
      acc[item.key] = item.value?.typed?.value;
      return acc;
    }, {});

    const resourceX = metadataMap.resource_x;
    const resourceY = metadataMap.resource_y;
    const poolComponent = metadataMap.pool_component;

    if (!resourceX || !resourceY || !poolComponent) {
      return null;
    }

    // Get actual pool reserves
    const reserves = await fetchPoolReserves(poolComponent);
    
    return {
      poolId: CAVIARNINE_HYPERSTAKE_ADDRESS,
      poolType: 'HYPERSTAKE',
      tokens: [
        {
          address: resourceX,
          symbol: null, // Will be filled by metadata processor
          amount: reserves.baseAmount || '0',
          decimals: reserves.baseDecimals || 18,
        },
        {
          address: resourceY,
          symbol: null, // Will be filled by metadata processor
          amount: reserves.quoteAmount || '0',
          decimals: reserves.quoteDecimals || 18,
        },
      ],
      name: 'HyperStake Pool',
      hasVault: true,
      vaultAddress: poolComponent,
      rawApiData: { metadata: metadataMap },
    };

  } catch (error) {
    console.error('[CAVIAR-RAW] HyperStake extraction failed:', error);
    return null;
  }
}

/**
 * Fetch LSU Pool raw data
 */
async function fetchCaviarNineLSUPoolRaw(): Promise<RawCaviarNineHyperstakePool | null> {
  try {
    const gatewayClient = RadixGatewayClient.getInstance();
    
    // Get component details
    const entity = await gatewayClient.state.getEntityDetailsVaultAggregated(
      CAVIARNINE_LSU_POOL_ADDRESS,
      {
        explicitMetadata: ['name'],
      }
    );

    const fungibleResources = entity?.fungible_resources?.items || [];
    
    // Calculate resource balances
    const tokens = fungibleResources
      .map((resource) => {
        let totalBalance = new BigNumber(0);
        
        if (resource.vaults?.items) {
          for (const vault of resource.vaults.items) {
            totalBalance = totalBalance.plus(new BigNumber(vault.amount || '0'));
          }
        }

        return {
          address: resource.resource_address,
          symbol: null, // Will be filled by metadata processor
          amount: totalBalance.toString(),
          decimals: 18, // Will be updated by metadata processor
        };
      })
      .filter((token) => new BigNumber(token.amount).gt(0))
      .sort((a, b) => new BigNumber(b.amount).comparedTo(new BigNumber(a.amount)))

    return {
      poolId: CAVIARNINE_LSU_POOL_ADDRESS,
      poolType: 'LSU_POOL',
      tokens,
      name: 'LSU Pool',
      hasVault: true,
      rawApiData: { fungibleResources },
    };

  } catch (error) {
    console.error('[CAVIAR-RAW] LSU Pool extraction failed:', error);
    return null;
  }
}

async function fetchPoolReserves(poolAddresses: string[]): Promise<{
  baseAmount: string;
  quoteAmount: string;
  baseDecimals: number;
  quoteDecimals: number;
}> {
  try {
    const gatewayClient = RadixGatewayClient.getInstance();
    
    // Fetch fungible resources held by the pool component
    const poolsResponse = await gatewayClient.state.getEntityDetailsVaultAggregated(poolAddresses);
    
    let promises: Promise<any>[] = []
    for (const pool of poolsResponse) {
      const resources = pool.fungible_resources.items;
      if (!resources) {
        console.log(`No fungible resources found for pool ${pool.address}`)
        continue;
      }
      
      // For a typical 2-resource pool, there should be exactly 2 resources
      if (resources.length !== 2) {
        console.log(`Expected 2 resources in pool, found ${resources.length}`)
        continue;
      }

      // Fetch metadata for both resources to get decimal information
      console.log
    }
    
    // tokenCache.resolve(promises)
    
    
    
    
    // Extract decimals from metadata (default to 18 if not found)
    // const baseDecimals = extractDecimalsFromMetadata(baseMetadata) || 18;
    // const quoteDecimals = extractDecimalsFromMetadata(quoteMetadata) || 18;
    return {
      // baseAmount: baseResource.amount || '0',
      // quoteAmount: quoteResource.amount || '0',
      // baseDecimals,
      // quoteDecimals,
    };
    
  } catch (error) {
    console.warn(`[POOL-RESERVES] Failed to fetch reserves for ${poolAddress}:`, error);
    return {
      baseAmount: '0',
      quoteAmount: '0',
      baseDecimals: 18,
      quoteDecimals: 18,
    };
  }
}

// Helper function to extract decimals from resource metadata
function extractDecimalsFromMetadata(metadata: any): number | null {
  try {
    const items = metadata?.items?.[0]?.metadata?.items;
    if (!items) return null;
    
    const decimalsItem = items.find((item: any) => item.key === 'divisibility');
    if (decimalsItem?.value?.typed?.value) {
      return parseInt(decimalsItem.value.typed.value);
    }
    
    return null;
  } catch {
    return null;
  }
}