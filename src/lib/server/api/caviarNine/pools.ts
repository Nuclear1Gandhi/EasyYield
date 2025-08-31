import { makeRateLimitedRequest } from '$shared/utils/rateLimiter/makeRateLimitedRequest';
import { CAVIARNINE_API_CONFIG, CAVIARNINE_CORE_API_URL } from './constants';
import type {
  FeeVaultsResponse,
  CaviarNineShapeLiquidityResponseStrict,
  CaviarNineTicker,
  PoolInfo,
  PoolInfoFungibleResource,
  BaseExtractedPoolInfo,
} from '$shared/typings/CaviarNine';
import { RadixGatewayClient } from '../gateway/gatewayClient';
import { CAVIARNINE_LSU_POOL_ADDRESS } from '$lib/constants';
import { tokenCache } from '$server/jobs/updateYieldSources/tokenCacheInstance';
import type { TokenMetadata } from '$server/services/tokenCache';
import { extractPoolInfo } from '$server/utils/pool';

/**
 * Fetch ticker data from CaviarNine API
 */
export async function fetchCaviarNineTickers() {
  const tickers = await makeRateLimitedRequest<CaviarNineTicker[]>(
    `${CAVIARNINE_CORE_API_URL}/cg/tickers`,
    'CaviarNine tickers',
    CAVIARNINE_API_CONFIG
  );

  return { tickers };
}
/**
 * Fetch ticker data from CaviarNine API
 */
export async function fetchCaviarNinePool(
  componentAddress: string
): Promise<CaviarNineShapeLiquidityResponseStrict> {
  const data =
    await makeRateLimitedRequest<CaviarNineShapeLiquidityResponseStrict>(
      `${CAVIARNINE_CORE_API_URL}/shapeliquidity/${componentAddress}`,
      'CaviarNine tickers',
      CAVIARNINE_API_CONFIG
    );

  return data;
}

/**
 * Fetch fee vault data from CaviarNine API
 */
export async function fetchCaviarNineFeeVaults() {
  return await makeRateLimitedRequest<FeeVaultsResponse>(
    `${CAVIARNINE_CORE_API_URL}/fee_vaults`,
    'CaviarNine fee vaults',
    CAVIARNINE_API_CONFIG
  );
}

export async function fetchCaviarNineLSUPool(): Promise<BaseExtractedPoolInfo> {
  console.log('[INFO] Fetching CaviarNine LSU Pool from Radix Gateway...');

  try {
    const gatewayClient = RadixGatewayClient.getInstance();
    // 1. Get component details with the correct options
    const lsu = await gatewayClient.state.getEntityDetailsVaultAggregated(
      CAVIARNINE_LSU_POOL_ADDRESS,
      {
        // Use only the supported options
        explicitMetadata: ['name', 'description', 'symbol', 'icon_url'],
        ancestorIdentities: true,
        componentRoyaltyVaultBalance: true,
        nativeResourceDetails: true,
      }
    );

    const resources = lsu.fungible_resources.items;
    if (!resources) {
      console.log(`No fungible resources found for pool ${lsu.address}`);
      throw new Error(`No fungible resources found for pool ${lsu.address}`);
    }

    // Fetch metadata for both resources to get decimal information
    try {
      const potentialPair = await tokenCache.resolve(
        resources.map((r) => r.resource_address)
      );
      const pair = potentialPair.filter((p): p is TokenMetadata => !!p);
      const info = extractPoolInfo(lsu);

      const updatedTokens = info.fungibleResources
        .map((f) => {
          const matchingPair = pair.find(
            (p) => p?.address === f.resourceAddress
          );
          if (!matchingPair) return null;

          return { ...f, ...matchingPair };
        })
        .filter(Boolean);
      return {
        ...info,
        fungibleResources: updatedTokens as PoolInfoFungibleResource[],
      };
    } catch (error) {
      throw error;
    }
  } catch (error) {
    console.warn(`[POOL-RESERVES] Failed to fetch reserves for s:`, error);

    throw error;
  }
}
