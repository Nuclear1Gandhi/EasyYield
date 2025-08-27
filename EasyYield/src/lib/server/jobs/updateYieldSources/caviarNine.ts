import { Dapps, YieldSourceType } from '$shared/typings/YieldSource';
import type { StateEntityDetailsVaultResponseItem } from '@radixdlt/babylon-gateway-api-sdk';
import type {
  BaseExtractedPoolInfo,
  CaviarNineTicker,
  PoolInfo,
  PoolInfoFungibleResource,
} from '$shared/typings/CaviarNine';
import type { RawPoolData } from '$server/services/source/rawDataExtractor';
import { fetchAstrolescentPrices } from '$server/api/astrolescent/astrolescent';
import {
  fetchCaviarNineFeeVaults,
  fetchCaviarNinePool,
  fetchCaviarNineTickers,
} from '$server/api/caviarNine/pools';
import { RadixGatewayClient } from '$server/api/gateway/gatewayClient';
import { tokenCache } from './tokenCacheInstance';
import type { TokenMetadata } from '$server/services/tokenCache';
import { DAPP_MAPPINGS } from '$lib/constants';
import {
  updateYieldSourcesBatch,
  type RawYieldSource,
} from './unifiedYieldSourceUpdater';
import { BigNumber } from 'bignumber.js';
import { writeFileSync } from 'fs';

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
  ticker: CaviarNineTicker
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
  const price = parseFloat(ticker.last_price);
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
  const vol = parseFloat(ticker.base_volume) + parseFloat(ticker.target_volume);
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
  const bid = parseFloat(ticker.bid),
    ask = parseFloat(ticker.ask);
  if (!isNaN(bid) && !isNaN(ask) && ask > 0) {
    const spreadRatio = (ask - bid) / ask;
    tags.add(spreadRatio > 0.005 ? 'wide spread' : 'tight spread');
  }

  // 8. Volatility range
  const high = parseFloat(ticker.high),
    low = parseFloat(ticker.low);
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
      console.log(data);
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
      if (resources.length !== 2) {
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

function extractPoolInfo(
  pool: StateEntityDetailsVaultResponseItem
): BaseExtractedPoolInfo {
  // Extract core identifiers
  const address = pool.address;

  // Extract fungible resource addresses and amounts
  const fungibleResources = pool.fungible_resources.items.map((fr) => {
    const resourceAddress = fr.resource_address;
    const vault = fr.vaults.items[0];
    const amount = vault ? vault.amount : '0';
    const vaultAddress = vault ? vault.vault_address : null;
    return { resourceAddress, amount, vaultAddress };
  });

  // Extract metadata fields as key-value pairs
  const metadata: any = {};
  pool.metadata.items.forEach((item) => {
    let value = null;
    if (item.value.typed) {
      if (item.value.typed.type === 'String') {
        value = item.value.typed.value;
      } else if (item.value.typed.type === 'StringArray') {
        value = item.value.typed.values;
      } else if (item.value.typed.type === 'GlobalAddress') {
        value = item.value.typed.value;
      }
    }
    metadata[item.key] = value;
  });

  // Extract key state fields from the details object
  const stateFields: { [key: string]: any } = {};
  if (
    pool.details &&
    pool.details.type === 'Component' &&
    pool.details.state &&
    //@ts-expect-error
    pool.details.state.fields
  ) {
    //@ts-expect-error
    pool.details.state.fields.forEach((field: any) => {
      stateFields[field.field_name] = field.value;
    });
  }

  // Extract roles overview
  const roles = {
    //@ts-expect-error
    owner: pool.details?.role_assignments?.owner || null,
    //@ts-expect-error
    entries: pool.details?.role_assignments?.entries || [],
  };

  return {
    address,
    fungibleResources,
    metadata,
    state: stateFields,
    roles,
  };
}

export async function getCaviarSources(): Promise<RawYieldSource[]> {
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

    const rawSources: RawYieldSource[] = [];
    // Process tickers
    if (
      tickersResult.status === 'fulfilled' &&
      feeVaultsResult.status === 'fulfilled'
    ) {
      const dexSources = await processTickersToRawYieldSource(
        tickersResult.value.tickers.slice(0, 100)
      );
      rawSources.push(...dexSources);
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
