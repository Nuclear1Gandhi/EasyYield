import { DAPP_MAPPINGS } from '$lib/constants';
import { fetchTopOciswapPools } from '$server/api/ociswap/pools';
import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { YieldSourceModel } from '$server/mongo/models/YieldSource';
import { cleanYieldSourceNameWithCache } from '$server/utils/yieldSourceNameCleaner';
import { type OciswapPool } from '$shared/typings/Ociswap';
import {
  Dapps,
  YieldSourceType,
  type OciswapMetadata,
  type YieldSubSource,
} from '$shared/typings/YieldSource';
import { BigNumber } from 'bignumber.js';

export async function updateOciswapYieldSources(): Promise<{
  updates: number;
  errors: number;
  updatedIds: string[];
}> {
  console.log('[INFO] Fetching fresh Ociswap yield sources data...');

  let pools: OciswapPool[];
  try {
    pools = await fetchTopOciswapPools();
  } catch (err) {
    console.error('[ERROR] Ociswap data fetch failed.', err);
    throw err;
  }

  console.log(
    `[INFO] Processing ${pools.length} Ociswap pools with embedded token data...`
  );
  const startTime = Date.now();

  let updates = 0;
  let errors = 0;
  const updatedIds: string[] = [];
  const now = new Date();

  for (const pool of pools) {
    try {
      // Process APY and TVL with BigNumber precision using correct field paths
      const rawApy = pool.apr['24h'] || '0';
      const rawTvl = pool.total_value_locked.usd.now || '0';

      const apyBn = new BigNumber(rawApy);
      const tvlBn = new BigNumber(rawTvl);

      const apy = apyBn.decimalPlaces(6, BigNumber.ROUND_DOWN);
      const tvl = tvlBn.decimalPlaces(0, BigNumber.ROUND_DOWN);

      // Extract token information from x and y fields (correct structure)
      const tokenX = pool.x.token;
      const tokenY = pool.y.token;

      const tokenSymbols = [
        tokenX.symbol || 'Unknown',
        tokenY.symbol || 'Unknown',
      ].filter((symbol) => symbol !== 'Unknown');

      const tokenIcons = [tokenX.icon_url, tokenY.icon_url].filter(Boolean);

      // Get clean display name
      const { displayName, description } = cleanYieldSourceNameWithCache(
        pool.name,
        YieldSourceType.DEX_PAIR
      );

      // Build protocol metadata using correct field types
      const protocolMetadata: OciswapMetadata = {
        protocol: Dapps.OCISWAP,
        poolVersion: pool.version,
        tickSpacing:
          pool.pool_type === 'concentrated_liquidity' ? 60 : undefined,
        priceRange: undefined, // We don't have price range data from the pool response
      };

      // Build yield sub-sources - for now just trading fees since that's what we have data for
      const yieldSubSources: YieldSubSource[] = [
        {
          type: 'trading_fees',
          apy: apy.toString(),
          description: 'DEX trading fees from swaps',
          isActive: true,
          risk: 'medium',
          lastUpdated: new Date(),
        },
      ];

      // Calculate additional metrics using correct field paths
      const volume7d = pool.volume.usd['7d'];
      const volume24h = pool.volume.usd['24h'];

      // Calculate change percentage (APR 7d vs 24h as proxy)
      const apy7d = new BigNumber(pool.apr['7d'] || '0');
      const apy24h = new BigNumber(pool.apr['24h'] || '0');

      let change: string | undefined;
      if (apy7d.gt(0) && apy24h.gt(0)) {
        const changePercent = apy24h
          .minus(apy7d)
          .dividedBy(apy7d)
          .multipliedBy(100);
        change = (changePercent.gte(0) ? '+' : '') + changePercent.toFixed(2);
      }

      // Determine status based on volume and TVL trends
      let status: 'growing' | 'stable' | 'volatile' = 'stable';
      const tvl24h = new BigNumber(pool.total_value_locked.usd['24h'] || '0');
      const tvlNow = new BigNumber(pool.total_value_locked.usd.now || '0');

      if (tvl24h.gt(0)) {
        const tvlChange = tvlNow
          .minus(tvl24h)
          .dividedBy(tvl24h)
          .multipliedBy(100);
        if (tvlChange.gt(5)) status = 'growing';
        else if (tvlChange.lt(-10)) status = 'volatile';
      }

      await YieldSourceModel.findOneAndUpdate(
        { yieldSourceAddress: pool.address },
        {
          $set: {
            name: pool.name,
            displayName,
            description,

            // Token data
            tokenSymbols,
            tokenIcons,

            // Protocol and type info
            protocolIcon: DAPP_MAPPINGS[Dapps.OCISWAP].fallbackIcon,
            protocolName: DAPP_MAPPINGS[Dapps.OCISWAP].name,
            type: YieldSourceType.DEX_PAIR,

            // Financial metrics with correct formatting
            currentApy: apy.toString(),
            apy7dAvg: pool.apr['7d'],
            tvl: `$${tvl.toString()}`,
            volume7d: volume7d,
            change,
            status,

            // Yield structure
            isComposite: false, // For now, just trading fees
            yieldSubSources,

            // Risk assessment
            riskProfile:
              pool.pool_type === 'concentrated_liquidity' ? 'medium' : 'low',

            // Protocol metadata
            protocolMetadata,

            // Timestamps
            lastUpdated: now,
            raw: pool,
          },
        },
        { upsert: true, new: true }
      );

      // Create historical record
      await HistoricalYieldModel.create({
        yieldSourceAddress: pool.address,
        apy: apy.toNumber(),
        tvl: tvl.toNumber(),
        timestamp: now,
      });

      updatedIds.push(pool.address);
      updates++;

      console.log(
        `[OK] Updated Ociswap pool ${displayName} (${tokenSymbols.join('/')}) - ` +
          `${pool.address.substring(0, 12)}... | ${apy.toFixed(2)}% APY | $${tvl.toFixed(0)} TVL`
      );
    } catch (err) {
      errors++;
      console.error(`[FAIL] Could not update Ociswap pool ${pool.name}:`, err);
    }
  }

  console.log(
    `[INFO] Ociswap processing completed in ${Date.now() - startTime}ms`
  );
  return { updates, errors, updatedIds };
}
