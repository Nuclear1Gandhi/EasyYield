import type {
  ProtocolDisplayData,
  ProtocolResponse,
} from '$shared/typings/Api';
import BigNumber from 'bignumber.js';

export function formatNumber(value: string | number, decimals = 2): string {
  const bn = new BigNumber(value);
  if (bn.isNaN()) return '0';

  // Format large numbers with K, M, B suffixes
  if (bn.gte(1_000_000_000)) {
    return bn.dividedBy(1_000_000_000).toFixed(1) + 'B';
  }
  if (bn.gte(1_000_000)) {
    return bn.dividedBy(1_000_000).toFixed(1) + 'M';
  }
  if (bn.gte(1_000)) {
    return bn.dividedBy(1_000).toFixed(1) + 'K';
  }
  return bn.toFixed(decimals);
}

export function formatApy(apy: string): string {
  const bn = new BigNumber(apy);
  return bn.isNaN() ? '0.00' : bn.toFixed(2);
}

export function calculateChange(current: string, avg7d: string | null): string {
  if (!avg7d) return '0.00';

  const currentBN = new BigNumber(current);
  const avgBN = new BigNumber(avg7d);

  if (currentBN.isNaN() || avgBN.isNaN() || avgBN.isZero()) return '0.00';

  const change = currentBN.minus(avgBN).dividedBy(avgBN).multipliedBy(100);
  const sign = change.isPositive() ? '+' : '';
  return sign + change.toFixed(2);
}

export function determineStatus(
  apyStd7d: string | null,
  tvlChange7d: string | null
): 'healthy' | 'stable' | 'volatile' {
  // If no volatility data, assume stable
  if (!apyStd7d) return 'stable';

  const volatility = new BigNumber(apyStd7d);
  const tvlChange = tvlChange7d ? new BigNumber(tvlChange7d) : new BigNumber(0);

  // High volatility (>2% std dev) or significant TVL change
  if (volatility.gt(2) || tvlChange.abs().gt(10)) {
    return 'volatile';
  }

  // Low volatility and positive/stable TVL
  if (volatility.lt(0.5) && tvlChange.gte(-2)) {
    return 'healthy';
  }

  return 'stable';
}

export function getProtocolIcon(type: string): string {
  switch (type) {
    case 'caviarnine':
      return 'tabler:coins';
    case 'xrd-staking':
      return 'tabler:stack-2';
    case 'ociswap':
      return 'tabler:arrows-exchange';
    default:
      return 'tabler:plug';
  }
}

export function transformProtocolData(
  protocol: ProtocolResponse
): ProtocolDisplayData {
  return {
    id: protocol.protocolId,
    name: protocol.name,
    apy: formatApy(protocol.currentApy),
    tvl: formatNumber(protocol.tvl),
    change: calculateChange(protocol.currentApy, protocol.apy7dAvg),
    status: determineStatus(protocol.apyStd7d, protocol.tvlChange7d),
    icon: getProtocolIcon(protocol.type),
    volatility: protocol.apyStd7d ? parseFloat(protocol.apyStd7d) : undefined,
  };
}
