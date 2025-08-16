import { fetchTopOciswapPools } from '$server/api/ociswap/pools';
import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { ProtocolModel } from '$server/mongo/models/Protocol';
import { ProtocolType } from '$shared/typings/Protocol';

let isJobRunning = false;

export async function updateProtocolsJob() {
  try {
    if (isJobRunning) {
      console.warn('[WARN] Skipping: updateProtocolsJob still running.');
      return;
    }

    isJobRunning = true;
    console.log('[INFO] Fetching fresh Ociswap protocol data...');
    let pools;
    try {
      pools = await fetchTopOciswapPools();
    } catch (err) {
      console.error(
        '[ERROR] Cannot update protocols: Ociswap data fetch failed.',
        err
      );
      return;
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
              currentApy: apy,
              tvl,
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
        console.log(`[OK] Updated protocol ${pool.name} (${pool.address})`);
      } catch (err) {
        errors++;
        console.error(
          `[FAIL] Could not update protocol ${pool.name} (${pool.address}):`,
          err
        );
      }
    }

    console.log(
      `[DONE] Protocol update finished: ${updates} updated, ${errors} errors.`
    );
  } finally {
    isJobRunning = false;
  }
}
