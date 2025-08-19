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
): 'healthy' | 'stable' | 'volatile' {
  if (apy.gte(10) && (vol ?? 0) < 2) return 'healthy';
  if ((vol ?? 0) < 5) return 'stable';
  return 'volatile';
}
