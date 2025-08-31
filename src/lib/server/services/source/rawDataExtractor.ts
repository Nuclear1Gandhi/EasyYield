import { Dapps, YieldSourceType } from '$shared/typings/YieldSource';

export interface RawPoolData {
  // Core identification
  dapp: Dapps;
  poolId: string;

  // Token data for TVL calculation
  tokens: Array<{
    address: string;
    symbol: string;
    amount: string; // Raw amount with decimals
    decimals: number;
  }>;

  // Metadata (to be enriched later)
  name?: string;
  type: YieldSourceType;

  // Raw protocol-specific data
  rawData: any;
}
