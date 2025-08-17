import BigNumber from 'bignumber.js';
import { fetchCaviarNinePools } from '$server/api/caviarNine/pools';
import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { ProtocolModel } from '$server/mongo/models/Protocol';
import type { ProtocolDocRaw } from '$shared/typings/Protocol';
import type { CaviarNinePoolWithVault } from '$shared/typings/CaviarNine';

export async function updateCaviarNineProtocols(): Promise<{
  updates: number;
  errors: number;
}> {
  console.log('[INFO] Fetching fresh CaviarNine protocol data...');

  let pools: ProtocolDocRaw<CaviarNinePoolWithVault>[];
  try {
    pools = await fetchCaviarNinePools();
  } catch (err) {
    console.error('[ERROR] CaviarNine data fetch failed.', err);
    throw err;
  }

  let updates = 0;
  let errors = 0;
  const now = new Date();

  for (const pool of pools) {
    try {
      // Determine APY source: prefer currentApy, then apr, else “0”
      const rawApy = pool.currentApy.toString() ?? pool.raw.apr ?? '0';
      const apyBn = new BigNumber(rawApy);

      // Determine TVL source: prefer tvl, then totalValueLocked, else “0”
      const rawTvl = pool.tvl.toString() ?? pool.raw.tvl ?? '0';
      const tvlBn = new BigNumber(rawTvl);

      // Clamp precision / formatting
      const apy = apyBn.decimalPlaces(6, BigNumber.ROUND_DOWN);
      const tvl = tvlBn.decimalPlaces(0, BigNumber.ROUND_DOWN);

      const name =
        pool.name ??
        (pool.raw.token0 && pool.raw.token1
          ? `${pool.raw.token0.symbol}-${pool.raw.token1.symbol}`
          : pool.protocolId);

      // Upsert the protocol record
      await ProtocolModel.findOneAndUpdate(
        { protocolId: pool.protocolId },
        {
          $set: {
            name,
            type: pool.type,
            currentApy: apy.toString(),
            tvl: tvl.toString(),
            lastUpdated: now,
            raw: pool,
          },
        },
        { upsert: true, new: true }
      );

      // Write historical yield (storing numbers, but they’ll be JS numbers)
      await HistoricalYieldModel.create({
        protocolId: pool.protocolId,
        apy: apy.toNumber(),
        tvl: tvl.toNumber(),
        timestamp: now,
      });

      updates++;
    } catch (err) {
      errors++;
      console.error(
        `[FAIL] Could not update CaviarNine pool ${pool.protocolId}:`,
        err
      );
    }
  }

  return { updates, errors };
}
