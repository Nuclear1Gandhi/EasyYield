import { fetchCaviarNinePools } from '$server/api/caviarNine/pools';
import { YieldSourceType } from '$shared/typings/YieldSource';
import { updateYieldSourcesBatch } from './unifiedYieldSourceUpdater';

export async function updateCaviarNineYieldSources() {
  console.log('[INFO] Fetching fresh CaviarNine yield sources data...');

  let pools;
  try {
    pools = await fetchCaviarNinePools();
  } catch (err) {
    console.error('[ERROR] CaviarNine data fetch failed.', err);
    throw err;
  }

  // ✅ Transform to unified format
  const rawYieldSources = pools.map((pool) => ({
    id: pool.yieldSourceId,
    originalName:
      pool.name ??
      (pool.raw.token0 && pool.raw.token1
        ? `${pool.raw.token0.symbol}-${pool.raw.token1.symbol}`
        : pool.yieldSourceId),
    type: YieldSourceType.LSU_POOL,
    rawApy: pool.currentApy.toString() ?? pool.raw.apr ?? '0',
    rawTvl: pool.tvl.toString() ?? pool.raw.tvl ?? '0',
    rawData: pool,
  }));

  // ✅ Use unified processor
  return updateYieldSourcesBatch(rawYieldSources, 'CaviarNine');
}
