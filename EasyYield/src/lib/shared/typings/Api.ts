import type {
  Features,
  Dapps,
  ProtocolMetadata,
  YieldSourceDocRaw,
} from './YieldSource';

export interface YieldSourceResponse {
  yieldSourceAddress: string;
  name: string;
  type: Dapps; // Updated to use Protocols enum instead of strings
  currentApy: string; // BigNumber string
  tvl: string; // BigNumber string
  lastUpdated: string;
  apy7dAvg: string | null;
  apyStd7d: string | null;
  tvlChange7d: string | null;
}

export type YieldSourceDisplayData<D extends Dapps = any> =
  YieldSourceDocRaw<D> & {
    fee: string;
    resourceRatio: string;
    // Metrics (from YieldSourceMetrics join)
    apy7dAvg?: string | null;
    apyStd7d?: string | null;
    tvlChange7d?: string | null;
  };

// Helper type for protocol-specific display data
export type CaviarNineDisplayData = YieldSourceDisplayData<Dapps.CAVIARNINE> & {
  protocolMetadata: Extract<
    ProtocolMetadata<Dapps>,
    { protocol: Dapps.CAVIARNINE }
  >;
};

export type OciswapDisplayData = YieldSourceDisplayData<Dapps.OCISWAP> & {
  protocolMetadata: Extract<
    ProtocolMetadata<Dapps>,
    { protocol: Dapps.OCISWAP }
  >;
};

export type RadixStakingDisplayData =
  YieldSourceDisplayData<Dapps.RADIX_STAKING> & {
    protocolMetadata: Extract<
      ProtocolMetadata<Dapps>,
      { protocol: Dapps.RADIX_STAKING }
    >;
  };

// Portfolio data (unchanged but could be enhanced)
export interface YieldSourceData {
  totalValue: string;
  totalYield: string;
  positions: YieldSourcePosition[];
  lastUpdated: string;
}

export interface YieldSourcePosition {
  yieldSourceAddress: string;
  amount: string;
  value: string;
  apy: string;
  protocol?: Dapps; // Added for better categorization
  features?: Features[]; // Show what features this position has
}

export interface YieldSourceHistoricalData {
  date: string;
  apy: string;
  tvl: string;
}

// New enhanced filter types
export interface YieldSourceFilters {
  protocols?: Dapps[];
  features?: Features[];
  minApy?: number;
  maxRisk?: 'low' | 'medium' | 'high';
  hasCompositeYield?: boolean;
  poolTypes?: {
    caviarNine?: ('SIMPLE_POOL' | 'LSU_POOL' | 'SHAPED_POOL' | 'INDEX_POOL')[];
    // Add other protocol-specific filters as needed
  };
}

// Helper type for feature-based categorization
export interface FeatureSummary {
  hasGovernance: boolean;
  hasFeeSharing: boolean;
  hasInstantLiquidity: boolean;
  hasNoIL: boolean;
  isCurated: boolean;
  hasCustomWeights: boolean;
  hasConcentratedLiquidity: boolean;
}

// Enhanced comparison type for cross-protocol analysis
export interface YieldSourceComparison {
  basic: YieldSourceDisplayData[];
  enhanced: YieldSourceDisplayData[]; // Has premium features
  premium: YieldSourceDisplayData[]; // Has multiple premium features
}
