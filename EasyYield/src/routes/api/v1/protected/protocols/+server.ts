import { ProtocolModel } from '$server/mongo/models/Protocol';
import { ProtocolMetricsModel } from '$server/mongo/models/ProtocolMetrics';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
  try {
    // 1. Fetch raw protocols
    const protocols = await ProtocolModel.find({}).lean();

    // 2. Fetch matching metrics
    const metrics = await ProtocolMetricsModel.find({
      protocolId: { $in: protocols.map((p) => p._id.toString()) },
    })
      .lean()
      // turn array into a lookup by protocolId for fast merging
      .then((arr) =>
        arr.reduce<Record<string, any>>((acc, m) => {
          acc[m.protocolId] = m;
          return acc;
        }, {})
      );

    // 3. Merge metrics into each protocol
    const combined = protocols.map((p) => {
      const m = metrics[p._id.toString()] || {};
      return {
        protocolId: p._id,
        name: p.name,
        type: p.type,
        currentApy: p.currentApy,
        tvl: p.tvl,
        lastUpdated: p.lastUpdated,
        apy7dAvg: m.apy7dAvg ?? null,
        apyStd7d: m.apyStd7d ?? null,
        tvlChange7d: m.tvlChange7d ?? null,
      };
    });

    // 4. Return the combined array
    return new Response(JSON.stringify(combined), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('DB Error', err);
    return new Response('Error querying protocols', { status: 500 });
  }
};
