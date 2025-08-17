import type { Document } from 'mongoose';
import type { OciswapPool } from './Ociswap';
import type { CaviarNinePoolWithVault } from './CaviarNine';

export enum ProtocolType {
  LSU_POOL = 'LSU_POOL',
  VALIDATOR = 'VALIDATOR',
  DEX_PAIR = 'DEX_PAIR',
}

export type ProtocolDocRaw<R = OciswapPool | CaviarNinePoolWithVault> = {
  protocolId: string;
  name: string;
  type: ProtocolType;
  currentApy: String;
  tvl: String;
  lastUpdated: Date;
  raw: R;
};

export type ProtocolDoc = Document & ProtocolDocRaw;
