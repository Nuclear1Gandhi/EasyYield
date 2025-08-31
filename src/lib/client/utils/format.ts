import BigNumber from 'bignumber.js';

export function formatPercent(bn: BigNumber): string {
  return bn.decimalPlaces(2).toString() + '%';
}

export function formatCurrency(bn: BigNumber): string {
  return '$' + bn.decimalPlaces(0).toFormat();
}

export function calculateStatus(
  apy: BigNumber,
  vol?: number
): 'growing' | 'stable' | 'volatile' {
  if (apy.gte(10) && (vol ?? 0) < 2) return 'growing';
  if ((vol ?? 0) < 5) return 'stable';
  return 'volatile';
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
}

export function formatLargeNumber(
  value: string | number | BigNumber,
  decimals = 1
): string {
  const num = new BigNumber(value);
  if (num.isNaN()) {
    return '0';
  }

  const abs = num.absoluteValue();
  const billion = new BigNumber(1_000_000_000);
  const million = new BigNumber(1_000_000);
  const thousand = new BigNumber(1_000);

  if (abs.isGreaterThanOrEqualTo(billion)) {
    return `${num.dividedBy(billion).toFixed(decimals)}B`;
  }
  if (abs.isGreaterThanOrEqualTo(million)) {
    return `${num.dividedBy(million).toFixed(decimals)}M`;
  }
  if (abs.isGreaterThanOrEqualTo(thousand)) {
    return `${num.dividedBy(thousand).toFixed(decimals)}K`;
  }
  return num.toFixed(decimals);
}
