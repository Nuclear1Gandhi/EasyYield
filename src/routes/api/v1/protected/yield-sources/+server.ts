import { YieldSourceModel } from '$server/mongo/models/YieldSource';
import { YieldSourceMetricsModel } from '$server/mongo/models/YieldSourceMetrics';
import type { YieldSourceDisplayData } from '$shared/typings/Api';
import type { Dapps } from '$shared/typings/YieldSource';
import { BigNumber } from 'bignumber.js';
import type { RequestHandler } from './$types';
import { getResourceRatio } from './utils';

// Updated GET handler with new field names
export const GET: RequestHandler = async () => {
  try {
    const yieldSources = await YieldSourceModel.find({}).lean();
    const metrics = await YieldSourceMetricsModel.find({
      yieldSourceAddress: {
        $in: yieldSources.map((p) => p.yieldSourceAddress),
      },
    }).lean();

    const metricsMap = metrics.reduce<Record<string, any>>((acc, m) => {
      acc[m.yieldSourceAddress] = m;
      return acc;
    }, {});

    const displayData: YieldSourceDisplayData<Dapps.CAVIARNINE>[] =
      yieldSources.map((s) => {
        const m = metricsMap[s.yieldSourceAddress] || {};
        return {
          ...s,
          lastUpdated: s.lastUpdated || new Date(),
          resourceRatio: getResourceRatio(s.tokens).toString(),
          fee: `${BigNumber(s.yieldSubSources[0].fee).multipliedBy(100).toPrecision(2)}%`,

          // Metrics
          apy7dAvg: m.apy7dAvg ?? null,
          apyStd7d: m.apyStd7d ?? null,
          tvlChange7d: m.tvlChange7d ?? null,
        };
      });

    return new Response(JSON.stringify(displayData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('DB Error', err);
    return new Response('Error querying yield sources', { status: 500 });
  }
};
