import { YieldSourceType } from '$shared/typings/YieldSource';

/**
 * Determine yield source type based on pool characteristics
 */
export function determineYieldSourceType(pool: any): YieldSourceType {
  switch (pool.poolType) {
    case 'LSU_POOL':
      return YieldSourceType.LSU_POOL;
    
    case 'HYPERSTAKE':
      return YieldSourceType.LSU_POOL; // HyperStake is a type of LSU pool
    
    case 'TICKER':
      // Check if it contains LSU tokens
      const hasLSUToken = pool.tokens?.some((token: any) => 
        token.symbol?.includes('LSU') || 
        token.symbol?.includes('STAKE') ||
        isLSUTokenAddress(token.address)
      );
      
      return hasLSUToken ? YieldSourceType.LSU_POOL : YieldSourceType.DEX_PAIR;
    
    default:
      return YieldSourceType.DEX_PAIR;
  }
}

/**
 * Check if token address is a known LSU token
 */
function isLSUTokenAddress(address: string): boolean {
  // Add known LSU token patterns or addresses here
  // This would replace your existing isLSUToken function
  const knownLSUPatterns = [
    'lsu',
    'stake',
    'liquid',
  ];
  
  return knownLSUPatterns.some(pattern => 
    address.toLowerCase().includes(pattern)
  );
}
