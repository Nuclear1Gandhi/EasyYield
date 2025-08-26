import type { Document } from 'mongoose';
import type { PoolInfoFungibleResource } from './CaviarNine';

export enum CaviarNinePoolType {
  'SIMPLE_POOL' = 'SIMPLE_POOL',
  'LSU_POOL' = 'LSU_POOL',
  'SHAPED_POOL' = 'SHAPED_POOL',
  'INDEX_POOL' = 'INDEX_POOL',
}

export enum Dapps {
  'CAVIARNINE' = 'CAVIARNINE',
  'OCISWAP' = 'OCISWAP',
  'RADIX_STAKING' = 'RADIX_STAKING',
}

export enum Features {
  'FEE_SHARING',
  'GOVERNANCE' = 'GOVERNANCE',
  'INSTANT_LIQUIDITY' = 'INSTANT_LIQUIDITY',
  'NO_IL' = 'NO_IL',
  'CURATED' = 'CURATED',
  'CUSTOM_WEIGHTS' = 'CUSTOM_WEIGHTS',
  'CONCENTRATED_LIQ' = 'CONCENTRATED_LIQ',
}

export type CaviarNineMetadata = {
  protocol: Dapps.CAVIARNINE;
  poolType: CaviarNinePoolType;
  hasVault: boolean;
  vaultAddress?: string;
  weights?: Array<{ token: string; weight: number }>;
  swapFee: string;
};

export type OciswapMetadata = {
  protocol: Dapps.OCISWAP;
  poolVersion: string;
  tickSpacing?: number;
  priceRange?: { min: string; max: string };
};

export type RadixStakingMetadata = {
  protocol: Dapps.RADIX_STAKING;
  validatorAddress: string;
  validatorName: string;
  uptimePercentage: number;
  slashingEvents: number;
};

// Union type for protocol metadata
export type ProtocolMetadata<P extends Dapps> = P extends Dapps.CAVIARNINE
  ? CaviarNineMetadata
  : P extends Dapps.OCISWAP
    ? OciswapMetadata
    : RadixStakingMetadata;

export enum YieldSourceType {
  LSU_POOL = 'LSU_POOL',
  VALIDATOR = 'VALIDATOR',
  DEX_PAIR = 'DEX_PAIR',
  HYPERSTAKE = 'HYPERSTAKE',
  SHAPE_LIQUIDITY = 'SHAPE_LIQUIDITY', // AMM pools with concentrated liquidity
  INSTANT_UNSTAKE = 'INSTANT_UNSTAKE', // Arbitrage premium opportunity
}

export type YieldSubSource = {
  type:
    | 'staking_rewards'
    | 'trading_fees'
    | 'liquidity_incentives'
    | 'arbitrage_premium'
    | 'protocol_fees'
    | 'protocol_revenue_sharing'; // Add missing type
  apy: string;
  risk: 'low' | 'medium' | 'high' | 'variable';
  fee: string;
  description: string;
  isActive: boolean;
  lastUpdated: Date;
};

export type YieldSourceMetrics = {
  yieldSourceId: string;
  apy7dAvg: string; // BigNumber string
  apyStd7d: string; // BigNumber string
  tvlChange24h: string;
  tvlChange7d: string;
  tvlChange30d: string;
  lastComputed: Date;
};

export type YieldSourceDocRaw<P extends Dapps, R = any> = {
  yieldSourceAddress: string;
  name: string;
  type: YieldSourceType;
  apy: string;
  tvl: string;
  lastUpdated: Date;

  // Standard metadata
  dapp: Dapps;
  dappIcon: string;
  tokens: PoolInfoFungibleResource[];

  volume24h: string;

  // Unified yield structure
  isComposite: boolean;
  yieldSubSources: YieldSubSource[];

  // Unified features (truly agnostic)
  features: Array<string>;

  // Protocol-specific metadata (discriminated union)
  protocolMetadata: ProtocolMetadata<P>;
  // Raw data storage
  raw: R;
};

export type YieldSourceDoc<P extends Dapps, R = any> = Document &
  YieldSourceDocRaw<P, R>;
