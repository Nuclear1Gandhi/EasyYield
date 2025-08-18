import type { Document } from 'mongoose';
import type { OciswapPool } from './Ociswap';
import type { CaviarNinePoolWithVault } from './CaviarNine';

export enum ProtocolType {
  LSU_POOL = 'LSU_POOL',
  VALIDATOR = 'VALIDATOR',
  DEX_PAIR = 'DEX_PAIR',
}

export type ProtocolMetrics = {
  protocolId: string;
  apy7dAvg: string; // BigNumber string
  apyStd7d: string; // BigNumber string
  tvlChange24h: string;
  tvlChange7d: string;
  tvlChange30d: string;
  lastComputed: Date;
};

export type ProtocolDocRaw<R = OciswapPool | CaviarNinePoolWithVault> = {
  protocolId: string;
  name: string;
  type: ProtocolType;
  currentApy: string;
  tvl: string;
  lastUpdated: Date;
  raw: R;
};

export type ProtocolDoc = Document & ProtocolDocRaw;
