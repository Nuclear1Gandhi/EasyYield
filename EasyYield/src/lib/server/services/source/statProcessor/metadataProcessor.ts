import { RadixGatewayClient } from '$server/api/gateway/gatewayClient';
import type { RawPoolData } from '../rawDataExtractor';

export interface TokenMetadata {
  symbol: string;
  name: string;
  iconUrl?: string;
  decimals: number;
}

export interface PoolMetadata {
  poolId: string;
  displayName: string;
  tokens: Record<string, TokenMetadata>;
}

export class RadixMetadataProcessor {
  async processAllPools(pools: RawPoolData[]): Promise<Map<string, PoolMetadata>> {
    console.log(`[METADATA] Processing metadata for ${pools.length} pools`);
    
    // 1. Extract all unique token addresses
    const allTokens = new Set<string>();
    pools.forEach(pool => {
      pool.tokens.forEach((token: any) => {
        allTokens.add(token.address);
      });
    });
    
    const tokenAddresses = Array.from(allTokens);
    console.log(`[METADATA] Found ${tokenAddresses.length} unique tokens to process`);
    
    // 2. Batch fetch token metadata from Radix Gateway
    const tokenMetadata = await this.batchFetchTokenMetadata(tokenAddresses);
    
    // 3. Process each pool
    const results = new Map<string, PoolMetadata>();
    
    for (const pool of pools) {
      const poolTokens: Record<string, TokenMetadata> = {};
      
      pool.tokens.forEach((token: any) => {
        const meta = tokenMetadata[token.address];
        if (meta) {
          poolTokens[token.address] = meta;
          // Update token decimals in the pool data
          token.decimals = meta.decimals;
          token.symbol = meta.symbol;
        }
      });
      
      results.set(pool.poolId, {
        poolId: pool.poolId,
        displayName: this.generateDisplayName(pool, poolTokens),
        tokens: poolTokens,
      });
    }
    
    console.log(`[METADATA] Processed metadata for ${results.size} pools`);
    return results;
  }
  
  /**
   * Batch fetch token metadata from Radix Gateway
   */
  private async batchFetchTokenMetadata(addresses: string[]): Promise<Record<string, TokenMetadata>> {
    const result: Record<string, TokenMetadata> = {};
    
    // Process in chunks to avoid overwhelming the Gateway API
    const chunks = this.chunkArray(addresses, 10);
    
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (address) => {
          try {
            const metadata = await this.fetchSingleTokenMetadata(address);
            if (metadata) {
              result[address] = metadata;
            }
          } catch (error) {
            console.warn(`[METADATA] Failed to fetch metadata for ${address}:`, error);
            // Set fallback metadata
            result[address] = {
              symbol: address.slice(-8).toUpperCase(),
              name: `Token ${address.slice(-8)}`,
              decimals: 18,
            };
          }
        })
      );
      
      // Small delay between chunks to be respectful to Gateway API
      if (chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return result;
  }
  
  /**
   * Fetch metadata for a single token from Radix Gateway
   */
  private async fetchSingleTokenMetadata(address: string): Promise<TokenMetadata | null> {
    try {
      const gatewayClient = RadixGatewayClient.getInstance();
      
      const entity = await gatewayClient.state.getEntityDetailsVaultAggregated(address, {
        explicitMetadata: ['name', 'symbol', 'description', 'icon_url', 'tags'],
      });
      
      const metadata = entity?.metadata?.items || [];
      const details = entity?.details;
      
      // Extract metadata fields
      const symbol = this.findMetadataValue(metadata, 'symbol') || address.slice(-8).toUpperCase();
      const name = this.findMetadataValue(metadata, 'name') || `Token ${address.slice(-8)}`;
      const iconUrl = this.findMetadataValue(metadata, 'icon_url');
      
      // Get decimals from token details
      let decimals = 18; // Default
      if (details?.type === 'FungibleResource' && details.divisibility !== undefined) {
        decimals = details.divisibility;
      }
      
      return {
        symbol,
        name,
        iconUrl,
        decimals,
      };
      
    } catch (error) {
      console.warn(`[METADATA] Gateway fetch failed for ${address.slice(-8)}:`, error);
      return null;
    }
  }
  
  /**
   * Extract value from metadata items array
   */
  private findMetadataValue(metadata: any[], key: string): string | undefined {
    const item = metadata.find(m => m.key === key);
    return item?.value?.typed?.value;
  }
  
  /**
   * Generate display name from pool tokens
   */
  private generateDisplayName(pool: any, tokens: Record<string, TokenMetadata>): string {
    const tokenSymbols = pool.tokens
      .map((token: any) => tokens[token.address]?.symbol || 'UNKNOWN')
      .join('/');
      
    return tokenSymbols || pool.name || pool.poolId.slice(-8);
  }
  
  /**
   * Utility function to chunk arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
