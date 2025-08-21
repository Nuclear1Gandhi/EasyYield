import { YieldSourceModel } from '$server/mongo/models/YieldSource';
import { YieldSourceMetricsModel } from '$server/mongo/models/YieldSourceMetrics';
import type { YieldSourceDisplayData } from '$shared/typings/Api';
import { sortYieldSources } from '$shared/utils/yieldSourceScore/yieldSourceScore';
import type { RequestHandler } from '@sveltejs/kit';
import BigNumber from 'bignumber.js';

export const GET: RequestHandler = async () => {
  try {
    // 1. Fetch raw yieldSources
    const yieldSources = await YieldSourceModel.find({}).lean();

    // 2. Fetch matching metrics
    const metrics = await YieldSourceMetricsModel.find({
      yieldSourceId: {
        $in: yieldSources.map((p) => p.yieldSourceId.toString()),
      },
    })
      .lean()
      .then((arr) =>
        arr.reduce<Record<string, any>>((acc, m) => {
          acc[m.yieldSourceId] = m;
          return acc;
        }, {})
      );

    // 3. Transform to YieldSourceDisplayData
    const displayData: YieldSourceDisplayData[] = yieldSources.map((s) => {
      const m = metrics[s._id.toString()] || {};
      // Format APY and TVL
      const apyBn = new BigNumber(s.currentApy || '0');
      const tvlBn = new BigNumber(s.tvl || '0');
      const changeBn = new BigNumber(m.tvlChange7d || '0');

      const formattedApy = apyBn.toFixed(2);
      const formattedTvl = '$' + tvlBn.toFormat(0);
      const formattedChange =
        (changeBn.gte(0) ? '+' : '') + changeBn.toFixed(2);

      // Calculate status
      const volatility = m.apyStd7d ? parseFloat(m.apyStd7d) : undefined;
      let status: 'growing' | 'stable' | 'volatile' = 'stable';

      if (s.isComposite && s.yieldSubSources) {
        // For composite sources, consider complexity in volatility assessment
        const baseVolatility = volatility || 0;
        const complexityFactor =
          s.yieldSubSources.filter((sub) => sub.isActive).length * 0.3;
        const adjustedVolatility = baseVolatility + complexityFactor;

        if (apyBn.gte(8) && adjustedVolatility < 3) {
          status = 'growing';
        } else if (adjustedVolatility > 6) {
          status = 'volatile';
        } else {
          status = 'stable';
        }
      } else {
        if (apyBn.gte(10) && (volatility || 0) < 2) {
          status = 'growing';
        } else if ((volatility || 0) > 5) {
          status = 'volatile';
        }
      }

      return {
        id: s.yieldSourceId,
        name: s.displayName || s.name,
        displayName: s.displayName,
        type: s.type,
        currentApy: s.currentApy,
        tvl: s.tvl,
        lastUpdated: s.lastUpdated?.toISOString() || new Date().toISOString(),

        // Icon data from DB
        dappIcon: s.dappIcon,
        dappName: s.dappName,
        tokenIcons: s.tokenIcons || [],
        tokenSymbols: s.tokenSymbols || [],

        // Metrics
        apy7dAvg: m.apy7dAvg ?? null,
        apyStd7d: m.apyStd7d ?? null,
        tvlChange7d: m.tvlChange7d ?? null,

        // Formatted for frontend
        apy: formattedApy,
        change: formattedChange,
        status,
        volatility,

        isComposite: s.isComposite || false,
        yieldSubSources: s.yieldSubSources || undefined,
      };
    });

    const sortedYieldSources = sortYieldSources(displayData);

    return new Response(JSON.stringify(sortedYieldSources), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('DB Error', err);
    return new Response('Error querying yield sources', { status: 500 });
  }
};
