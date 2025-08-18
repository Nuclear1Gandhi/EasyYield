import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { ProtocolMetricsModel } from '$server/mongo/models/ProtocolMetrics';
import { computeProtocolMetrics } from '$shared/utils/protocolMetrics/metricsCalculator';

export async function computeAndUpsertMetrics(protocolId: string) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const history = await HistoricalYieldModel.find({
    protocolId,
    timestamp: { $gte: sevenDaysAgo },
  });

  const computed = computeProtocolMetrics(history);
  if (!computed) return;

  await ProtocolMetricsModel.updateOne(
    { protocolId },
    {
      $set: {
        ...computed,
        lastComputed: new Date(),
      },
    },
    { upsert: true }
  );
}
