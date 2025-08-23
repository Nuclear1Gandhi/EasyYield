import { YieldSourceModel } from '$server/mongo/models/YieldSource';
import { YieldSourceMetricsModel } from '$server/mongo/models/YieldSourceMetrics';
import type { YieldSourceDisplayData } from '$shared/typings/Api';
import { Features } from '$shared/typings/YieldSource';
import { sortYieldSources } from '$shared/utils/yieldSourceScore/yieldSourceScore';
import { BigNumber } from 'bignumber.js';
import type { RequestHandler } from './$types';

// Updated GET handler with new field names
export const GET: RequestHandler = async () => {
  try {
    const yieldSources = await YieldSourceModel.find({}).lean();
    const metrics = await YieldSourceMetricsModel.find({
      yieldSourceId: { $in: yieldSources.map((p) => p.yieldSourceId) },
    }).lean();

    const metricsMap = metrics.reduce<Record<string, any>>((acc, m) => {
      acc[m.yieldSourceId] = m;
      return acc;
    }, {});

    const displayData: YieldSourceDisplayData[] = yieldSources.map((s) => {
      const m = metricsMap[s.yieldSourceId] || {};

      // Format APY and TVL (unchanged)
      const apyBn = new BigNumber(s.currentApy || '0');
      const tvlBn = new BigNumber(s.tvl || '0');
      const changeBn = new BigNumber(m.tvlChange7d || '0');

      const formattedApy = apyBn.toFixed(2);
      const formattedChange =
        (changeBn.gte(0) ? '+' : '') + changeBn.toFixed(2);

      // Enhanced status calculation with features
      const volatility = m.apyStd7d ? parseFloat(m.apyStd7d) : undefined;
      const hasStableFeatures = s.features?.includes(Features.NO_IL) || false;
      const hasVolatileFeatures =
        s.features?.includes(Features.CONCENTRATED_LIQ) || false;

      let status: 'growing' | 'stable' | 'volatile' = 'stable';

      if (apyBn.gte(10) && (volatility || 0) < 2 && hasStableFeatures) {
        status = 'growing';
      } else if ((volatility || 0) > 5 || hasVolatileFeatures) {
        status = 'volatile';
      }

      // Calculate risk profile from features and yield sources
      let riskProfile: 'low' | 'medium' | 'high' | 'mixed' = 'medium';
      if (s.yieldSubSources && s.yieldSubSources.length > 0) {
        const risks = s.yieldSubSources.map((sub) => sub.risk);
        const uniqueRisks = [...new Set(risks)];

        if (uniqueRisks.length === 1) {
          riskProfile = uniqueRisks[0] as 'low' | 'medium' | 'high';
        } else {
          riskProfile = 'mixed';
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
        raw: s.raw,
        // Updated field names
        protocolIcon: s.protocolIcon,
        protocolName: s.protocolName,
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
        riskProfile,

        // New unified structure
        isComposite: s.isComposite || false,
        yieldSubSources: s.yieldSubSources || undefined,
        features: s.features || [],
        protocolMetadata: s.protocolMetadata,
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
