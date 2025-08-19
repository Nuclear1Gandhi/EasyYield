// src/server/jobs/updateYieldSources/updateOciswapYieldSources.ts
import BigNumber from 'bignumber.js';
import { fetchTopOciswapPools } from '$server/api/ociswap/pools';
import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { YieldSourceModel } from '$server/mongo/models/YieldSource';
import { YieldSourceType } from '$shared/typings/YieldSource';
import {
  cleanYieldSourceNameWithCache,
  extractTokenSymbols,
} from '$server/utils/yieldSourceNameCleaner';
import { getDappMapping, getYieldSource } from '$shared/utils/dataTransform';

export async function updateOciswapYieldSources(): Promise<{
  updates: number;
  errors: number;
  updatedIds: string[];
}> {
  console.log('[INFO] Fetching fresh Ociswap yield sources data...');

  let pools;
  try {
    pools = await fetchTopOciswapPools();
  } catch (err) {
    console.error('[ERROR] Ociswap data fetch failed.', err);
    throw err;
  }

  // ✅ Extract token info directly from pool data (no resource fetching needed)
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
      // Process APY and TVL with BigNumber precision
      const rawApy = pool.apr?.['24h'] || '0';
      const rawTvl = pool.total_value_locked?.usd?.now || '0';

      const apyBn = new BigNumber(rawApy);
      const tvlBn = new BigNumber(rawTvl);

      const apy = apyBn.decimalPlaces(6, BigNumber.ROUND_DOWN);
      const tvl = tvlBn.decimalPlaces(0, BigNumber.ROUND_DOWN);

      // ✅ Extract token information from x and y fields
      const tokenX = pool.x?.token;
      const tokenY = pool.y?.token;

      const tokenSymbols = [
        tokenX?.symbol || 'Unknown',
        tokenY?.symbol || 'Unknown',
      ].filter((symbol) => symbol !== 'Unknown');

      const tokenIcons = [tokenX?.icon_url, tokenY?.icon_url].filter(
        Boolean
      ) as string[];

      // Get clean display name (no resource addresses to process for Ociswap)
      const { displayName, description } = cleanYieldSourceNameWithCache(
        pool.name,
        YieldSourceType.DEX_PAIR
      );

      // Get protocol info
      const protocolMapping = getDappMapping(YieldSourceType.DEX_PAIR);

      await YieldSourceModel.findOneAndUpdate(
        { yieldSourceId: pool.address },
        {
          $set: {
            name: pool.name,

            // ✅ Use extracted token data directly
            displayName,
            description,
            tokenSymbols,
            tokenIcons, // Already have URLs from pool data

            // Protocol info
            dappIcon: protocolMapping.fallbackIcon, // Can enhance this with dApp definitions later
            dappName: protocolMapping.name,

            type: YieldSourceType.DEX_PAIR,
            currentApy: apy.toString(),
            tvl: tvl.toString(),
            lastUpdated: now,
            raw: pool,
          },
        },
        { upsert: true, new: true }
      );

      await HistoricalYieldModel.create({
        yieldSourceId: pool.address,
        apy: apy.toNumber(),
        tvl: tvl.toNumber(),
        timestamp: now,
      });

      updatedIds.push(pool.address);
      updates++;
      console.log(
        `[OK] Updated Ociswap pool ${displayName} (${tokenSymbols.join('/')}) - ${pool.address.substring(0, 12)}...`
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
