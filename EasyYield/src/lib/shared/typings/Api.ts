export interface YieldSourceResponse {
  yieldSourceId: string;
  name: string;
  type: 'caviarnine' | 'xrd-staking' | 'ociswap';
  currentApy: string; // BigNumber string
  tvl: string; // BigNumber string
  lastUpdated: string;
  apy7dAvg: string | null;
  apyStd7d: string | null;
  tvlChange7d: string | null;
}

export interface YieldSourceDisplayData {
  id: string;
  name: string;
  displayName?: string;
  type: string;
  currentApy: string;
  tvl: string;
  lastUpdated: string;

  // Icon/visual data from DB
  dappIcon?: string;
  dappName?: string;
  tokenIcons: string[];
  tokenSymbols: string[];

  // Metrics (from YieldSourceMetrics join)
  apy7dAvg?: string | null;
  apyStd7d?: string | null;
  tvlChange7d?: string | null;

  // Computed frontend fields
  apy: string; // formatted currentApy
  change: string; // formatted tvlChange7d
  status: 'healthy' | 'stable' | 'volatile';
  volatility?: number;
}

// Portfolio data (you might have this from wallet integration)
export interface YieldSourceData {
  totalValue: string;
  totalYield: string;
  positions: YieldSourcePosition[];
  lastUpdated: string;
}

export interface YieldSourcePosition {
  yieldSourceId: string;
  amount: string;
  value: string;
  apy: string;
}
