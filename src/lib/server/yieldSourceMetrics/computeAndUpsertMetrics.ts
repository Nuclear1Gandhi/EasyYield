import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { YieldSourceMetricsModel } from '$server/mongo/models/YieldSourceMetrics';
import { computeYieldSourceMetrics } from '$shared/utils/yieldSourceMetrics/metricsCalculator';

export async function computeAndUpsertMetrics(yieldSourceAddress: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const history = await HistoricalYieldModel.find({
    yieldSourceAddress,
    timestamp: { $gte: sevenDaysAgo },
  });

  const computed = computeYieldSourceMetrics(history);
  if (!computed) return;

  await YieldSourceMetricsModel.updateOne(
    { yieldSourceAddress },
    {
      $set: {
        ...computed,
        lastComputed: new Date(),
      },
    },
    { upsert: true }
  );
}
