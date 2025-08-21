import type {
  CaviarNinePair,
  CaviarNinePoolWithVault,
  CaviarNineTicker,
  FeeVaultsResponse,
} from '$shared/typings/CaviarNine';
import {
  YieldSourceType,
  type YieldSourceDocRaw,
  type YieldSubSource,
} from '$shared/typings/YieldSource';
import { makeRateLimitedRequest } from '$shared/utils/rateLimiter/makeRateLimitedRequest';
import {
  CAVIARNINE_API_CONFIG,
  CAVIARNINE_CORE_API_URL,
  CaviarNineAPIError,
} from './constants';
import { getMockCaviarNinePools } from './mockPools.js';

function calculateYieldSubSources(
  pool: CaviarNinePoolWithVault,
  estimatedApy: number,
  volume24h: number,
  estimatedTVL: number,
  hasVault: boolean // NEW parameter
): YieldSubSource[] {
  const subSources: YieldSubSource[] = [];

  const isLSUPool =
    pool.type === 'LSU' ||
    pool.token0?.symbol?.toUpperCase().includes('LSU') ||
    pool.token1?.symbol?.toUpperCase().includes('LSU');

  if (isLSUPool) {
    // Base staking rewards
    subSources.push({
      type: 'staking_rewards',
      apy: '5.2',
      risk: 'low',
      description: 'Validator staking rewards from LSU tokens',
      isActive: true,
      lastUpdated: new Date(),
    });

    // Trading fees (higher for vault pools)
    const feeMultiplier = hasVault ? 1.2 : 1.0; // Vault pools get 20% higher effective fees
    const tradingFeeApy =
      estimatedTVL > 0
        ? ((volume24h * 0.003 * feeMultiplier * 365) / estimatedTVL) * 100
        : 0;

    subSources.push({
      type: 'trading_fees',
      apy: tradingFeeApy.toFixed(2),
      risk: 'medium',
      description: hasVault
        ? 'Enhanced fees from vault-optimized LSU swaps'
        : 'Standard fees from LSU token swaps',
      isActive: true,
      lastUpdated: new Date(),
    });

    // Vault-exclusive benefits
    if (hasVault) {
      subSources.push({
        type: 'liquidity_incentives',
        apy: '2.50',
        risk: 'medium',
        description: 'FLOOP token rewards for vault participants',
        isActive: true,
        lastUpdated: new Date(),
      });

      subSources.push({
        type: 'protocol_revenue_sharing',
        apy: '1.80',
        risk: 'low',
        description: 'Share of CaviarNine protocol fees',
        isActive: true,
        lastUpdated: new Date(),
      });
    }
  } else {
    // Regular DEX pools
    const baseApy = hasVault ? estimatedApy * 1.15 : estimatedApy; // 15% bonus for vault pools

    subSources.push({
      type: 'trading_fees',
      apy: baseApy.toFixed(2),
      risk: 'medium',
      description: hasVault
        ? 'Enhanced trading fees with vault optimization'
        : 'Standard DEX trading fees',
      isActive: true,
      lastUpdated: new Date(),
    });

    if (hasVault) {
      subSources.push({
        type: 'protocol_revenue_sharing',
        apy: '0.75',
        risk: 'low',
        description: 'Protocol fee distribution to vault participants',
        isActive: true,
        lastUpdated: new Date(),
      });
    }
  }

  return subSources;
}

// ✅ Check if we should use mocks
const USE_MOCKS =
  process.env.NODE_ENV === 'development' && process.env.USE_MOCK === 'true';

export async function processTicker(
  ticker: CaviarNineTicker,
  feeVaultsData: FeeVaultsResponse
): Promise<YieldSourceDocRaw<CaviarNinePoolWithVault> | null> {
  // 1. Validation
  if (!ticker.pool_id || !ticker.base_currency || !ticker.target_currency) {
    console.warn('[VALIDATION] Invalid ticker:', ticker);
    return null;
  }

  // 2. Yield calculation
  const volume24h = parseFloat(ticker.base_volume) || 0;
  const estimatedTVL = volume24h * 10;
  const estimatedApy =
    estimatedTVL > 0 ? ((volume24h * 0.003 * 365) / estimatedTVL) * 100 : 0;
  if (isNaN(estimatedApy) || estimatedApy < 0) return null;

  // 3. Find matching vault entry
  const matchingVault = feeVaultsData?.data.find(
    (v) => v.component_address === ticker.pool_id
  );
  // 4. Determine pool category and data source
  const hasVault = !!matchingVault;
  const poolCategory = hasVault ? 'PREMIUM_VAULT' : 'BASIC_DEX';

  type Token = { name: string | null; symbol: string | null; address: string };
  let token0Data: Token, token1Data: Token;

  if (hasVault) {
    // Use fee vault data for names/symbols
    token0Data = {
      address: ticker.base_currency,
      symbol: matchingVault.base_resource_symbol,
      name: matchingVault.base_resource_name,
    };
    token1Data = {
      address: ticker.target_currency,
      symbol: matchingVault.vault_resource_symbol,
      name: matchingVault.vault_resource_name,
    };
  } else {
    // Mark for later resolution - we'll need to fetch these
    token0Data = {
      address: ticker.base_currency,
      symbol: null, // Will be resolved later
      name: null,
    };
    token1Data = {
      address: ticker.target_currency,
      symbol: null,
      name: null,
    };
  }

  // 5. Build pool with vault category
  const pool: CaviarNinePoolWithVault = {
    address: ticker.pool_id,
    name: hasVault
      ? `${token0Data.symbol}/${token1Data.symbol}`
      : `${ticker.base_currency}/${ticker.target_currency}`,
    type:
      token0Data.symbol?.includes('LSU') || token1Data.symbol?.includes('LSU')
        ? 'LSU'
        : 'DEX',
    apy: estimatedApy.toFixed(2),
    tvl: estimatedTVL.toString(),
    token0: token0Data,
    token1: token1Data,
    feeVaultData: matchingVault,

    // NEW: Add vault categorization
    hasVault,
    poolCategory,
    vaultBenefits: hasVault
      ? [
          'Protocol revenue sharing',
          'Governance token rewards',
          'Advanced DeFi features',
          'Higher composite APY',
        ]
      : [],
  };

  // 6. Calculate yield sources (enhanced for vault vs non-vault)
  const yieldSubSources = calculateYieldSubSources(
    pool,
    estimatedApy,
    volume24h,
    estimatedTVL,
    hasVault // Pass vault status
  );

  const isComposite = yieldSubSources.length > 1;
  const compositeApy = yieldSubSources
    .filter((sub) => sub.isActive)
    .reduce((sum, sub) => sum + parseFloat(sub.apy), 0);

  return {
    yieldSourceId: pool.address,
    name: `CaviarNine ${pool.name}`,
    displayName: pool.name,
    type:
      pool.type === 'LSU' ? YieldSourceType.LSU_POOL : YieldSourceType.DEX_PAIR,
    tvl: pool.tvl!,
    lastUpdated: new Date(),
    raw: pool,
    dappIcon: '',
    dappName: '',
    tokenIcons: [],
    tokenSymbols: hasVault ? [token0Data.symbol!, token1Data.symbol!] : [],
    isComposite,
    currentApy: compositeApy.toFixed(2),
    yieldSubSources,

    // NEW: Add vault metadata for UI
    hasVault,
    vaultCategory: poolCategory,
  };
}

function checkLiquidityIncentives(pool: CaviarNinePoolWithVault): boolean {
  // TODO: Check against actual CaviarNine incentive programs
  // For now, assume LSU pools have incentives
  return pool.type === 'LSU';
}

function calculateArbitragePremium(pool: CaviarNinePoolWithVault): number {
  // TODO: Calculate actual arbitrage premium from price differentials
  // This would require comparing LSU-LP/XRD price vs direct staking
  return pool.type === 'LSU' ? 1.2 : 0; // Placeholder
}

export async function fetchCaviarNinePools(): Promise<
  YieldSourceDocRaw<CaviarNinePoolWithVault>[]
> {
  const startTime = Date.now();
  console.log('[INFO] Starting CaviarNine pools fetch...');

  // ✅ Return mock data in development
  if (Boolean(USE_MOCKS)) {
    console.log('[MOCK] Using mock CaviarNine pools instead of API');
    // Simulate API delay for realistic testing
    await new Promise((resolve) =>
      setTimeout(resolve, 500 + Math.random() * 1000)
    );

    const mockPools = getMockCaviarNinePools();
    const duration = Date.now() - startTime;
    console.log(
      `[SUCCESS] Fetched ${mockPools.length} CaviarNine pools (MOCK) in ${duration}ms`
    );
    return mockPools;
  }

  try {
    const yieldSources: YieldSourceDocRaw<CaviarNinePoolWithVault>[] = [];
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

    const tokensNeedingResolution = new Set<string>();

    // Process tickers data
    if (tickersData && Array.isArray(tickersData) && feeVaultsData) {
      for (const ticker of tickersData) {
        try {
          const yieldSource = await processTicker(ticker, feeVaultsData);
          if (yieldSource) {
            yieldSources.push(yieldSource);
            // Collect tokens that need resolution (no vault data)
            if (!yieldSource.hasVault) {
              tokensNeedingResolution.add(ticker.base_currency);
              tokensNeedingResolution.add(ticker.target_currency);
            }
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
    if (yieldSources.length === 0) {
      throw new CaviarNineAPIError(
        'No valid yield sources extracted from CaviarNine data',
        undefined,
        'NO_YIELD_SOURCES_FOUND'
      );
    }

    const duration = Date.now() - startTime;
    console.log(
      `[SUCCESS] Fetched ${yieldSources.length} CaviarNine pools in ${duration}ms`
    );
    return yieldSources;
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(
      `[FATAL] CaviarNine pools fetch failed after ${duration}ms:`,
      error
    );

    // ✅ Fallback to mocks in development if API fails
    if (process.env.NODE_ENV === 'development') {
      console.log('[FALLBACK] Using mock CaviarNine pools due to API error');
      return getMockCaviarNinePools();
    }

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
