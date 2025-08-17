import { fetchTopOciswapPools } from '$server/api/ociswap/pools';
import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { ProtocolModel } from '$server/mongo/models/Protocol';
import { ProtocolType } from '$shared/typings/Protocol';

export async function updateOciswapProtocols(): Promise<{
  updates: number;
  errors: number;
}> {
  console.log('[INFO] Fetching fresh Ociswap protocol data...');

  let pools;
  try {
    pools = await fetchTopOciswapPools();
  } catch (err) {
    console.error('[ERROR] Ociswap data fetch failed.', err);
    throw err;
  }

  let updates = 0;
  let errors = 0;
  const now = new Date();

  for (const pool of pools) {
    try {
      const apy = Number(pool.apr?.['24h']) || 0;
      const tvl = Number(pool.total_value_locked?.usd?.now) || 0;

      await ProtocolModel.findOneAndUpdate(
        { protocolId: pool.address },
        {
          $set: {
            name: pool.name,
            type: ProtocolType.DEX_PAIR,
            currentApy: apy.toString(), // Store as string for big numbers
            tvl: tvl.toString(),
            lastUpdated: now,
            raw: pool,
          },
        },
        { upsert: true, new: true }
      );

      await HistoricalYieldModel.create({
        protocolId: pool.address,
        apy,
        tvl,
        timestamp: now,
      });

      updates++;
      console.log(`[OK] Updated Ociswap pool ${pool.name} (${pool.address})`);
    } catch (err) {
      errors++;
      console.error(`[FAIL] Could not update Ociswap pool ${pool.name}:`, err);
    }
  }

  return { updates, errors };
}
