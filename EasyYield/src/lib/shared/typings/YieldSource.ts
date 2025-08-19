import type { Document } from 'mongoose';
import type { OciswapPool } from './Ociswap';
import type { CaviarNinePoolWithVault } from './CaviarNine';

export enum YieldSourceType {
  LSU_POOL = 'LSU_POOL',
  VALIDATOR = 'VALIDATOR',
  DEX_PAIR = 'DEX_PAIR',
}

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
};

export type YieldSourceDoc = Document & YieldSourceDocRaw;
