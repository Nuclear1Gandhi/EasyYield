import { YIELD_SOURCE_MAPPINGS } from '$lib/constants';
import type {
  YieldSourceDisplayData,
  YieldSourceResponse,
} from '$shared/typings/Api';
import type { YieldSourceType } from '$shared/typings/YieldSource';
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
): 'growing' | 'stable' | 'volatile' {
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
    return 'growing';
  }

  return 'stable';
}

export function getYieldSource(type: string): string {
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

export function transformYieldSourceData(
  yieldSource: YieldSourceResponse
): YieldSourceDisplayData {
  return {
    id: yieldSource.yieldSourceId,
    name: yieldSource.name,
    apy: formatApy(yieldSource.currentApy),
    tvl: formatNumber(yieldSource.tvl),
    change: calculateChange(yieldSource.currentApy, yieldSource.apy7dAvg),
    status: determineStatus(yieldSource.apyStd7d, yieldSource.tvlChange7d),
    icon: getYieldSource(yieldSource.type),
    volatility: yieldSource.apyStd7d
      ? parseFloat(yieldSource.apyStd7d)
      : undefined,
  };
}

export function generateFallbackName(resourceAddress: string): string {
  const prefix = 'resource_';
  if (resourceAddress.startsWith(prefix)) {
    const withoutPrefix = resourceAddress.slice(prefix.length);
    const parts = withoutPrefix.split('_');

    if (parts.length >= 3) {
      const hash = parts[2];
      return hash.length > 8 ? hash.substring(0, 8) : hash;
    }
  }
  return 'Resource';
}

export function extractResourceAddresses(text: string): string[] {
  const resourceMatches = text.match(/resource_[a-z0-9_]+/gi) || [];
  return resourceMatches;
}

export function getDappMapping(yieldSourceType: YieldSourceType) {
  return (
    YIELD_SOURCE_MAPPINGS[yieldSourceType] || {
      name: 'Unknown',
      dappDefinitionAddress: null,
      fallbackIcon: '/icons/protocols/default.svg',
    }
  );
}

// Fallback for when metadata isn't available
export function getFallbackTokenIcon(symbol: string): string {
  const fallbacks: Record<string, string> = {
    XRD: '/icons/tokens/xrd.svg',
    USDC: '/icons/tokens/usdc.svg',
    USDT: '/icons/tokens/usdt.svg',
    LSULP: '/icons/tokens/lsulp.svg',
  };

  return fallbacks[symbol.toUpperCase()] || '/icons/tokens/generic.svg';
}
