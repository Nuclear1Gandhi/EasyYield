import type {
  CaviarNinePair,
  CaviarNinePoolWithVault,
  CaviarNineTicker,
  FeeVault,
  FeeVaultsResponse,
} from '$shared/typings/CaviarNine';
import {
  ProtocolType,
  type ProtocolDoc,
  type ProtocolDocRaw,
} from '$shared/typings/Protocol';
import { makeRateLimitedRequest } from '$shared/utils/rateLimiter/makeRateLimitedRequest';
import {
  CAVIARNINE_API_CONFIG,
  CAVIARNINE_CORE_API_URL,
  CaviarNineAPIError,
} from './constants';

export function processTicker(
  ticker: CaviarNineTicker,
  feeVaultsData: FeeVaultsResponse
): ProtocolDocRaw<CaviarNinePoolWithVault> | null {
  // 1. Validation
  if (!ticker.pool_id || !ticker.base_currency || !ticker.target_currency) {
    console.warn('[VALIDATION] Invalid ticker:', ticker);
    return null;
  }

  // 2. Calculate yields (same as before)…
  const volume24h = parseFloat(ticker.base_volume) || 0;
  const estimatedFeeRate = 0.003;
  const estimatedTVL = volume24h * 10;
  const estimatedApy =
    estimatedTVL > 0
      ? ((volume24h * estimatedFeeRate * 365) / estimatedTVL) * 100
      : 0;
  if (isNaN(estimatedApy) || estimatedApy < 0) return null;

  // 3. Find matching vault entry
  const matchingVault: FeeVault | null =
    feeVaultsData.data.find((v) => v.component_address === ticker.pool_id) ||
    null;

  // 4. Map ticker → CaviarNinePool shape
  const baseSym = ticker.base_currency;
  const targetSym = ticker.target_currency;
  const pool: CaviarNinePoolWithVault = {
    address: ticker.pool_id,
    name: `${baseSym}/${targetSym}`,
    type: baseSym.includes('LSU') || targetSym.includes('LSU') ? 'LSU' : 'DEX',
    apy: estimatedApy.toFixed(2),
    tvl: estimatedTVL.toString(),
    token0: { symbol: baseSym },
    token1: { symbol: targetSym },
    feeVaultData: matchingVault,
  };

  // 5. Build ProtocolDoc
  const protocol: ProtocolDocRaw<CaviarNinePoolWithVault> = {
    protocolId: pool.address,
    name: `CaviarNine ${pool.name}`,
    type: pool.type === 'LSU' ? ProtocolType.LSU_POOL : ProtocolType.DEX_PAIR,
    currentApy: pool.apy!,
    tvl: pool.tvl!,
    lastUpdated: new Date(),
    raw: pool,
  };

  return protocol;
}

export async function fetchCaviarNinePools(): Promise<
  ProtocolDocRaw<CaviarNinePoolWithVault>[]
> {
  const startTime = Date.now();
  console.log('[INFO] Starting CaviarNine pools fetch...');

  try {
    const protocols: ProtocolDocRaw<CaviarNinePoolWithVault>[] = [];
    let tickersData: CaviarNineTicker[] = [];
    let pairsData: CaviarNinePair[] = [];
    let feeVaultsData: FeeVaultsResponse | null = null;

    // Fetch tickers data with rate limiting and error handling
    try {
      tickersData = await makeRateLimitedRequest<CaviarNineTicker[]>(
        `${CAVIARNINE_CORE_API_URL}/cg/tickers`,
        'CaviarNine tickers',
        CAVIARNINE_API_CONFIG
      );
    } catch (error) {
      console.error('[ERROR] Failed to fetch CaviarNine tickers:', error);
      // Continue without tickers data
    }

    // Fetch pairs data with rate limiting and error handling
    try {
      pairsData = await makeRateLimitedRequest<CaviarNinePair[]>(
        `${CAVIARNINE_CORE_API_URL}/cg/pairs`,
        'CaviarNine pairs',
        CAVIARNINE_API_CONFIG
      );
    } catch (error) {
      console.error('[ERROR] Failed to fetch CaviarNine pairs:', error);
      // Continue without pairs data
    }

    // Fetch fee vaults data (optional)
    try {
      feeVaultsData = await makeRateLimitedRequest<FeeVaultsResponse>(
        `${CAVIARNINE_CORE_API_URL}/fee_vaults`,
        'CaviarNine fee vaults',
        CAVIARNINE_API_CONFIG
      );
    } catch (error: any) {
      console.warn('[WARN] Fee vaults data not available:', error.message);
      // This is optional, so continue
    }

    // Process tickers data
    if (tickersData && Array.isArray(tickersData) && feeVaultsData) {
      for (const ticker of tickersData) {
        try {
          const protocol = processTicker(ticker, feeVaultsData);
          if (protocol) {
            protocols.push(protocol);
          }
        } catch (error) {
          console.error(
            `[ERROR] Failed to process ticker ${ticker?.ticker_id}:`,
            error
          );
          // Continue processing other tickers
        }
      }
    }

    // Validate results
    if (protocols.length === 0) {
      throw new CaviarNineAPIError(
        'No valid protocols extracted from CaviarNine data',
        undefined,
        'NO_PROTOCOLS_FOUND'
      );
    }

    const duration = Date.now() - startTime;
    console.log(
      `[SUCCESS] Fetched ${protocols.length} CaviarNine pools in ${duration}ms`
    );
    return protocols;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(
      `[FATAL] CaviarNine pools fetch failed after ${duration}ms:`,
      error
    );

    if (error instanceof CaviarNineAPIError) {
      throw error;
    }

    throw new CaviarNineAPIError(
      `Unexpected error fetching CaviarNine pools: ${error.message}`,
      undefined,
      'UNEXPECTED_ERROR',
      error
    );
  }
}
