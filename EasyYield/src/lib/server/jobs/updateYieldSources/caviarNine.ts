import { Dapps, YieldSourceType } from '$shared/typings/YieldSource';
import type { StateEntityDetailsVaultResponseItem } from '@radixdlt/babylon-gateway-api-sdk';
import type {
  BaseExtractedPoolInfo,
  CaviarNineTicker,
  PoolInfo,
  PoolInfoFungibleResource,
} from '$shared/typings/CaviarNine';
import { fetchAstrolescentPrices } from '$server/api/astrolescent/astrolescent';
import {
  fetchCaviarNineLSUPool,
  fetchCaviarNinePool,
  fetchCaviarNineTickers,
} from '$server/api/caviarNine/pools';
import { RadixGatewayClient } from '$server/api/gateway/gatewayClient';
import { tokenCache } from './tokenCacheInstance';
import type { TokenMetadata } from '$server/services/tokenCache';
import { CAVIARNINE_LSU_POOL_ADDRESS, DAPP_MAPPINGS } from '$lib/constants';
import {
  updateYieldSourcesBatch,
  type RawYieldSource,
} from './unifiedYieldSourceUpdater';
import { BigNumber } from 'bignumber.js';
import { extractPoolInfo } from '$server/utils/pool';

const addPrices = async (pools: BaseExtractedPoolInfo[]) => {
  const allTokenAddresses = pools.flatMap((p) =>
    p.fungibleResources.map((f) => f.resourceAddress)
  );
  const prices = await fetchAstrolescentPrices(allTokenAddresses);
  return pools.map((p) => {
    const newFungibleResources = p.fungibleResources.map((f) => ({
      ...f,
      price: prices[f.resourceAddress],
    }));
    return {
      ...p,
      fungibleResources: newFungibleResources,
    };
  });
};

/**
 * Process ticker data into unified Rawpool format
 */
async function processTickersToRawYieldSource(
  tickers: CaviarNineTicker[]
): Promise<RawYieldSource[]> {
  const rawYieldSources: RawYieldSource[] = [];

  const pools = await getPools(tickers.map((t) => t.pool_id));
  const poolsWPrices = await addPrices(pools);
  for (const ticker of tickers) {
    try {
      const pool = poolsWPrices.find((p) => p.address === ticker.pool_id);
      const rawYieldSource = await tickerToYieldSource(ticker, pool);
      if (rawYieldSource) rawYieldSources.push(rawYieldSource);
    } catch (error) {
      console.warn(
        `[CAVIAR-RAW] Failed to process ticker ${ticker.pool_id}:`,
        error
      );
    }
  }

  return rawYieldSources;
}

async function processLSUToRawYieldSource(
  lsu: BaseExtractedPoolInfo
): Promise<RawYieldSource | null> {
  if (!lsu.address || !lsu.fungibleResources?.length) {
    return null;
  }

  const [lsuWPrices] = await addPrices([lsu]);

  try {
    const tokens = lsuWPrices.fungibleResources;
    const tvl = BigNumber(calculateTVL(tokens));

    // Calculate weighted average APY from individual LSU tokens
    const { weightedApy, totalValidators } = await calculateLSUPoolAPY(
      tokens,
      lsu
    );

    const apy = weightedApy;
    const fee = '0.0005'; // Standard liquidity fee for LSU pools (0.05%)

    // Generate appropriate name for LSU pool
    const poolName = `LSU Multi-Validator Pool (${totalValidators} validators)`;

    return {
      address: lsuWPrices.address,
      name: poolName,
      tokens,
      tvl: tvl.toString(),
      apy,

      type: YieldSourceType.LSU_POOL,

      status: undefined,

      dapp: Dapps.CAVIARNINE,
      dappIcon: DAPP_MAPPINGS[Dapps.CAVIARNINE].fallbackIcon,

      volume24h: '0',

      features: extractPoolTags(lsu, null),
      yieldSubSources: [
        {
          type: 'liquid_staking',
          apy,
          risk: 'medium',
          description: `Yield from liquid staking across ${totalValidators} validators, providing staking rewards while maintaining liquidity in a diversified pool.`,
          fee,
          isActive: true,
          lastUpdated: new Date(),
        },
      ],
      raw: {
        ...lsu,
      },
    };
  } catch (error) {
    console.warn(`[LSU-RAW] Failed to process LSU pool ${lsu.address}:`, error);
    return null;
  }
}

// Helper function to query a key-value store using Radix Gateway API
async function queryKeyValueStore(
  kvsAddress: string,
  key: string
): Promise<string | null> {
  try {
    const gatewayClient = RadixGatewayClient.getInstance();
    // Use your existing Gateway API client to query the key-value store
    // This is a placeholder - replace with your actual Gateway API implementation
    const response = await gatewayClient.state.getAllEntityMetadata(kvsAddress);

    console.log(response);
    // Parse the response to extract the validator address for the given LSU key
    // The exact implementation depends on how your Gateway API client works
    // and the structure of the key-value store response

    console.warn(
      `[TODO] Implement actual key-value store query for ${kvsAddress} with key ${key}`
    );
    return null; // Replace with actual implementation
  } catch (error) {
    console.error(
      `[KVS-QUERY] Failed to query key-value store ${kvsAddress} for key ${key}:`,
      error
    );
    return null;
  }
}

// Helper function to get validator address from LSU resource address using the pool's mapping
async function getLSUValidatorMapping(
  lsuResourceAddress: string,
  lsuPoolData: BaseExtractedPoolInfo
): Promise<string | null> {
  try {
    const lsuToValidatorKVS = lsuPoolData.state?.validator_address_map;
    console.log(lsuPoolData);
    if (!lsuToValidatorKVS) {
      console.warn(
        `[LSU-MAPPING] No lsu_to_validator key-value store found in pool data`
      );
      return null;
    }

    // Query the key-value store for this LSU resource address
    // This would depend on how you access Radix key-value stores in your codebase
    // You might need to use the Gateway API to query the key-value store
    const validatorAddress = await queryKeyValueStore(
      lsuToValidatorKVS,
      lsuResourceAddress
    );

    if (!validatorAddress) {
      console.warn(
        `[LSU-MAPPING] No validator found for LSU ${lsuResourceAddress} in mapping`
      );
      return null;
    }

    console.log(
      `[LSU-MAPPING] Mapped LSU ${lsuResourceAddress} to validator ${validatorAddress}`
    );
    return validatorAddress;
  } catch (error) {
    console.error(
      `[LSU-MAPPING] Failed to get validator mapping for LSU ${lsuResourceAddress}:`,
      error
    );
    return null;
  }
}

// Helper function to get validator APY from LSU resource address
async function getValidatorAPYFromLSU(
  lsuResourceAddress: string,
  lsuPoolData: BaseExtractedPoolInfo
): Promise<string | null> {
  try {
    // Get the specific validator for this individual LSU token
    const validatorAddress = await getLSUValidatorMapping(
      lsuResourceAddress,
      lsuPoolData
    );

    if (!validatorAddress) {
      console.warn(
        `[LSU-VALIDATOR-APY] No validator mapping found for LSU: ${lsuResourceAddress}`
      );
      return null;
    }

    // Fetch all validators from gateway
    const gatewayClient = RadixGatewayClient.getInstance();
    const validators = await gatewayClient.state.getValidators();

    if (!validators || validators.items.length === 0) {
      console.warn(`[LSU-VALIDATOR-APY] No validators found from gateway`);
      return null;
    }

    // Find the specific validator for this LSU token
    const specificValidator = validators.items.find(
      (v) => v.address === validatorAddress
    );

    if (!specificValidator) {
      console.warn(
        `[LSU-VALIDATOR-APY] Validator ${validatorAddress} not found in gateway data`
      );
      return null;
    }

    const apy = specificValidator.apy || '0';
    console.log(
      `[LSU-VALIDATOR-APY] Found APY ${apy}% for validator ${validatorAddress} (LSU: ${lsuResourceAddress})`
    );

    return apy;
  } catch (error) {
    console.error(
      `[LSU-VALIDATOR-APY] Failed to get APY for LSU ${lsuResourceAddress}:`,
      error
    );
    return null;
  }
}
// Helper function to calculate weighted APY from LSU tokens
async function calculateLSUPoolAPY(
  tokens: PoolInfoFungibleResource,
  lsu: BaseExtractedPoolInfo
): Promise<{
  weightedApy: string;
  totalValidators: number;
}> {
  let totalValue = BigNumber(0);
  let weightedAPYSum = BigNumber(0);
  let activeValidators = 0;

  for (const token of tokens) {
    const tokenAmount = BigNumber(token.amount);
    const tokenPrice = BigNumber(token.price || 0);
    const tokenValue = tokenAmount.multipliedBy(tokenPrice);

    // Skip tokens with zero amount or price
    if (tokenValue.isZero()) {
      continue;
    }

    // Get validator APY for this LSU token
    const validatorAPY = await getValidatorAPYFromLSU(
      token.resourceAddress,
      lsu
    );

    if (validatorAPY && !BigNumber(validatorAPY).isZero()) {
      const weightedContribution = tokenValue.multipliedBy(validatorAPY);
      weightedAPYSum = weightedAPYSum.plus(weightedContribution);
      totalValue = totalValue.plus(tokenValue);
      activeValidators++;
    }
  }

  const weightedApy = totalValue.isZero()
    ? '0'
    : weightedAPYSum.dividedBy(totalValue).toString();

  return {
    weightedApy,
    totalValidators: activeValidators,
  };
}

function calculateTVL(
  fungibleResources: PoolInfo['fungibleResources']
): string {
  let tvl = new BigNumber(0);

  for (const token of fungibleResources) {
    // Normalize token amount by decimals if amount is raw
    // If amount is already human-readable decimal string, skip this step
    const amountRaw = new BigNumber(token.amount);
    // Optionally normalize: amount = amountRaw.dividedBy(new BigNumber(10).pow(token.decimals));
    // Assuming amount is already decimal string, use directly:
    tvl = tvl.plus(amountRaw.multipliedBy(token.price));
  }

  return tvl.toFixed(); // returns string with full precision
}

export const calculateApy = (sourceType: YieldSourceType) => {
  switch (sourceType) {
    case YieldSourceType.DEX_PAIR:
      return async (ticker: CaviarNineTicker, dapp: Dapps) => {
        // return await calculateDexPairApy();
      };
    default:
      return async (pool: PoolInfo) => {
        return '0';
      };
  }
};

/**
 * Infers user-facing tags purely from the raw on-chain info (metadata + state)
 * and the Caviar ticker.
 */
export function extractPoolTags(
  pool: BaseExtractedPoolInfo,
  ticker?: CaviarNineTicker
): string[] {
  const tags = new Set<string>();

  // 1. Carry over any on-chain tags
  (pool.metadata.tags || []).forEach((t) => tags.add(t.toLowerCase()));

  // 2. Asset pair
  const pair = `${pool.metadata.token_x}/${pool.metadata.token_y}`;
  tags.add(pair);

  // 3. AMM-style LP (all Caviar pools)
  tags.add('amm');
  tags.add('liquidity pool');

  // 4. Concentrated liquidity if bin_span exists
  const span = pool.state.bin_span;
  if (typeof span === 'number') {
    tags.add(span > 100 ? 'wide bins' : 'narrow bins');
  }

  // 5. Price classification
  const price = parseFloat(ticker?.last_price ?? 'NaN');
  if (!isNaN(price)) {
    tags.add(
      price > 1
        ? 'premium asset'
        : price < 0.01
          ? 'micro asset'
          : 'mid-price asset'
    );
  }

  // 6. 24h volume classification
  const vol =
    parseFloat(ticker?.base_volume ?? 'NaN') +
    parseFloat(ticker?.target_volume ?? 'NaN');
  if (!isNaN(vol)) {
    tags.add(
      vol > 1_000_000
        ? 'high volume'
        : vol < 10_000
          ? 'low volume'
          : 'medium volume'
    );
  }

  // 7. Spread tightness
  const bid = parseFloat(ticker?.bid ?? 'NaN');
  const ask = parseFloat(ticker?.ask ?? 'NaN');
  if (!isNaN(bid) && !isNaN(ask) && ask > 0) {
    const spreadRatio = (ask - bid) / ask;
    tags.add(spreadRatio > 0.005 ? 'wide spread' : 'tight spread');
  }

  // 8. Volatility range
  const high = parseFloat(ticker?.high ?? 'NaN');
  const low = parseFloat(ticker?.low ?? 'NaN');
  if (!isNaN(high) && !isNaN(low) && low > 0) {
    const range = (high - low) / low;
    tags.add(range > 0.1 ? 'volatile' : 'stable');
  }

  return Array.from(tags);
}

/**
 * Convert single ticker to unified Rawpool format
 */
async function tickerToYieldSource(
  ticker: CaviarNineTicker,
  pool: PoolInfo | undefined
): Promise<RawYieldSource | null> {
  // Basic validation
  if (!ticker.pool_id || !ticker.base_currency || !ticker.target_currency) {
    return null;
  }

  const tokens = pool?.fungibleResources ?? [];

  const tvl = BigNumber(calculateTVL(tokens));
  let apy = '0';
  let fee = '0';
  try {
    if (pool) {
      const data = await fetchCaviarNinePool(pool?.address);
      apy = BigNumber(data.apy_perc).multipliedBy(100).toString();
      fee = data.fees_perc;
    }
  } catch (error) {
    console.error(error);
  }

  return {
    address: pool?.address!,
    name: `${tokens[0].symbol}/${tokens[1].symbol}`,
    tokens,
    tvl: tvl.toString(),
    apy,

    type: YieldSourceType.DEX_PAIR,

    status: undefined,

    dapp: Dapps.CAVIARNINE,
    dappIcon: DAPP_MAPPINGS[Dapps.CAVIARNINE].fallbackIcon,

    volume24h: '0',

    features: extractPoolTags(pool!, ticker),
    yieldSubSources: [
      {
        type: 'trading_fees', // Trading fees are the core yield source
        apy, // Replace 'X.XX' with the actual Active APY percentage string from Shape Liquidity API (e.g., '12.34')
        risk: 'low', // Trading fees generally carry low risk relative to incentive tokens or staking
        description:
          'Active trading fees earned from concentrated liquidity provision in the pool.',
        fee,
        isActive: true, // Active yield source as trades are regularly executed
        lastUpdated: new Date(), // Timestamp when this APY and data was last fetched or updated
      },
    ],
    raw: {
      ...ticker,
      ...pool,
    },
  };
}

async function getPools(
  poolAddresses: string[]
): Promise<BaseExtractedPoolInfo[]> {
  try {
    const gatewayClient = RadixGatewayClient.getInstance();

    // Fetch fungible resources held by the pool component
    const poolsResponse =
      await gatewayClient.state.getEntityDetailsVaultAggregated(poolAddresses);

    let promises: Promise<PoolInfo>[] = [];
    for (const pool of poolsResponse) {
      const resources = pool.fungible_resources.items;
      if (!resources) {
        console.log(`No fungible resources found for pool ${pool.address}`);
        continue;
      }

      // For a typical 2-resource pool, there should be exactly 2 resources
      if (resources.length < 2) {
        console.log(`Expected 2 resources in pool, found ${resources.length}`);
        continue;
      }

      // Fetch metadata for both resources to get decimal information
      let promise = new Promise<PoolInfo>(async (resolve, reject) => {
        try {
          const potentialPair = await tokenCache.resolve(
            resources.map((r) => r.resource_address)
          );
          const pair = potentialPair.filter((p): p is TokenMetadata => !!p);
          const info = extractPoolInfo(pool);

          const updatedTokens = info.fungibleResources
            .map((f) => {
              const matchingPair = pair.find(
                (p) => p?.address === f.resourceAddress
              );
              if (!matchingPair) return null;

              return { ...f, ...matchingPair };
            })
            .filter(Boolean);
          return resolve({
            ...info,
            fungibleResources: updatedTokens as PoolInfoFungibleResource[],
          });
        } catch (error) {
          return reject(error);
        }
      });

      promises.push(promise);
    }

    const pools = await Promise.all(promises);
    return pools;
  } catch (error) {
    console.warn(`[POOL-RESERVES] Failed to fetch reserves for s:`, error);

    return [];
  }
}

export async function getCaviarSources(): Promise<RawYieldSource[]> {
  try {
    // Fetch all data sources in parallel
    const [
      tickersResult,
      // feeVaultsResult,
      lsuPoolResult,
      // hyperStakeResult,
    ] = await Promise.allSettled([
      fetchCaviarNineTickers(),
      // fetchCaviarNineFeeVaults(),
      fetchCaviarNineLSUPool(),
      // fetchCaviarNineHyperStakeRaw(),
      // fetchCaviarNineLSUPoolRaw(),
    ]);

    const rawSources: RawYieldSource[] = [];
    // Process tickers
    if (tickersResult.status === 'fulfilled') {
      const dexSources = await processTickersToRawYieldSource(
        tickersResult.value.tickers.slice(0, 1)
      );
      rawSources.push(...dexSources);
    }
    // Process tickers
    if (lsuPoolResult.status === 'fulfilled') {
      const lsu = await processLSUToRawYieldSource(lsuPoolResult.value);
      if (lsu) rawSources.push(lsu);
    }

    console.log(
      `[CAVIAR-EXTRACT] Successfully extracted ${rawSources.length} unified pools`
    );
    return rawSources;
  } catch (error) {
    console.error('[CAVIAR-EXTRACT] Failed to extract raw data:', error);
    throw error;
  }
}

export async function updateCaviarNineYieldSources() {
  console.log('[CAVIAR-UPDATE] Starting CaviarNine yield sources update...');

  try {
    // 1. Extract unified raw pool data
    const rawCaviarSources = await getCaviarSources();
    console.log(
      `[CAVIAR-UPDATE] Extracted ${rawCaviarSources.length} unified pools`
    );

    // 6. Save to database
    return updateYieldSourcesBatch<Dapps.CAVIARNINE>(
      rawCaviarSources,
      Dapps.CAVIARNINE
    );
  } catch (error) {
    console.error('[CAVIAR-UPDATE] Update failed:', error);
    throw error;
  }
}
