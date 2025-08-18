export interface ProtocolResponse {
  protocolId: string;
  name: string;
  type: 'caviarnine' | 'xrd-staking' | 'ociswap';
  currentApy: string; // BigNumber string
  tvl: string; // BigNumber string
  lastUpdated: string;
  apy7dAvg: string | null;
  apyStd7d: string | null;
  tvlChange7d: string | null;
}

// Transform for UI components
export interface ProtocolDisplayData {
  id: string;
  name: string;
  apy: string; // formatted for display
  tvl: string; // formatted for display
  change: string; // formatted change with +/-
  status: 'healthy' | 'stable' | 'volatile';
  icon: string;
  volatility?: number; // calculated from apyStd7d
}
// Portfolio data (you might have this from wallet integration)
export interface PortfolioData {
  totalValue: string;
  totalYield: string;
  positions: PortfolioPosition[];
  lastUpdated: string;
}

export interface PortfolioPosition {
  protocolId: string;
  amount: string;
  value: string;
  apy: string;
}
