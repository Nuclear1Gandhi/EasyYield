import type { Document } from 'mongoose';
import type { OciswapPool } from './Ociswap';

export enum ProtocolType {
  LSU_POOL = 'LSU_POOL',
  VALIDATOR = 'VALIDATOR',
  DEX_PAIR = 'DEX_PAIR',
}

export interface ProtocolDoc extends Document {
  protocolId: string;
  name: string;
  type: ProtocolType;
  currentApy: String;
  tvl: String;
  lastUpdated: Date;
  raw: OciswapPool;
}
