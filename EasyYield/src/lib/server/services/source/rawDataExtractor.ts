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

/**
 * Extract raw pool data from your existing YieldSourceDocRaw format
 */
export function extractRawPoolData<P extends Dapps>(
  yieldSources: any[], // Your existing YieldSourceDocRaw[]
  protocol: P
): RawPoolData[] {
  return yieldSources.map(source => {
    // Extract tokens based on protocol-specific structure
    const tokens = extractTokensFromSource(source, protocol);
    
    return {
      protocol,
      poolId: source.yieldSourceId,
      tokens,
      name: source.name,
      type: source.type,
      rawData: source,
    };
  });
}

function extractTokensFromSource(source: any, protocol: Dapps) {
  switch (protocol) {
    case Dapps.CAVIARNINE:
      // Extract from your existing CaviarNine structure
      if (source.raw.token0 && source.raw.token1) {
        return [
          {
            address: source.raw.token0.address,
            symbol: source.raw.token0.symbol || 'UNKNOWN',
            amount: '0', // We'll get real amounts later
            decimals: 18, // Default, get real decimals later
          },
          {
            address: source.raw.token1.address,
            symbol: source.raw.token1.symbol || 'UNKNOWN',
            amount: '0', // We'll get real amounts later
            decimals: 18, // Default, get real decimals later
          },
        ];
      }
      return [];
      
    case Dapps.OCISWAP:
      // Handle Ociswap structure when you add it
      return [];
      
    default:
      return [];
  }
}