import type { Document } from 'mongoose';
import type { OciswapPool } from './Ociswap';
import type { CaviarNinePoolWithVault } from './CaviarNine';

export enum YieldSourceType {
  LSU_POOL = 'LSU_POOL',
  VALIDATOR = 'VALIDATOR',
  DEX_PAIR = 'DEX_PAIR',
  SHAPE_LIQUIDITY = 'SHAPE_LIQUIDITY', // AMM pools with concentrated liquidity
  INSTANT_UNSTAKE = 'INSTANT_UNSTAKE', // Arbitrage premium opportunity
}

export type YieldSubSource = {
  type:
    | 'staking_rewards'
    | 'trading_fees'
    | 'liquidity_incentives'
    | 'arbitrage_premium'
    | 'protocol_fees';
  apy: string; // Individual APY contribution
  risk: 'low' | 'medium' | 'high' | 'variable';
  description: string; // e.g., "Validator staking rewards from LSU pool"
  isActive: boolean; // Some incentives are time-limited
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

export type YieldSourceDocRaw<R = OciswapPool | CaviarNinePoolWithVault> = {
  yieldSourceId: string;
  name: string;
  displayName: string;
  type: YieldSourceType;
  currentApy: string;
  tvl: string;
  lastUpdated: Date;
  dappIcon: string; // e.g., 'caviarnine', 'ociswap', 'radix'
  dappName: string;
  tokenIcons: string[]; // e.g., ['xrd', 'usdc'] for XRD/USDC pair
  tokenSymbols: string[]; // e.g., ['XRD', 'USDC']
  raw: R;
  // NEW: Multiple yield source breakdown
  yieldSubSources?: YieldSubSource[]; // For CaviarNine's complex yields
  isComposite?: boolean; // Flag to indicate multiple yield sources
  hasVault?: boolean;
  vaultCategory?: 'PREMIUM_VAULT' | 'BASIC_DEX';
};

export type YieldSourceDoc = Document & YieldSourceDocRaw;
