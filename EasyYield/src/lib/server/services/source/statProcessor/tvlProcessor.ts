import { BigNumber } from 'bignumber.js';
import type { RawPoolData } from '../rawDataExtractor';
import { fetchRadixTokenPrices } from '$server/api/astrolescent/astrolescent';

export interface TVLResult {
  poolId: string;
  tvlUsd: string;
  breakdown: Array<{
    symbol: string;
    amount: string;
    priceUsd: number;
    valueUsd: string;
  }>;
}

export class TVLProcessor {
  async processAllPools(pools: RawPoolData[]): Promise<Map<string, TVLResult>> {
    console.log(`[TVL] Processing TVL for ${pools.length} Radix pools`);
    
    // 1. Extract all unique Radix token addresses
    const allAddresses = new Set<string>();
    pools.forEach(pool => {
      pool.tokens.forEach(token => {
        allAddresses.add(token.address);
      });
    });
    
    const addressArray = Array.from(allAddresses);
    console.log(`[TVL] Found ${addressArray.length} unique Radix tokens: ${addressArray.map(a => a.slice(-8)).join(', ')}`);
    
    // 2. Fetch USD prices for all tokens at once
    const prices = await fetchRadixTokenPrices(addressArray);
    console.log(`[TVL] Retrieved ${Object.keys(prices).length} token prices from Astrolescent`);
    
    // 3. Calculate TVL for each pool
    const results = new Map<string, TVLResult>();
    
    for (const pool of pools) {
      try {
        // Get real reserves if needed, for now use existing amounts
        const tvlResult = this.calculatePoolTVL(pool, prices);
        results.set(pool.poolId, tvlResult);
      } catch (error) {
        console.error(`[TVL] Error calculating TVL for pool ${pool.poolId}:`, error);
        results.set(pool.poolId, {
          poolId: pool.poolId,
          tvlUsd: '0',
          breakdown: [],
        });
      }
    }
    
    console.log(`[TVL] Successfully calculated TVL for ${results.size} pools`);
    return results;
  }
  
  private calculatePoolTVL(pool: RawPoolData, prices: Record<string, number>): TVLResult {
    const breakdown: TVLResult['breakdown'] = [];
    let totalValue = new BigNumber(0);

    for (const token of pool.tokens) {
      const rawPrice = prices[token.address.toLowerCase()] || 0;
      const priceBN = new BigNumber(rawPrice);

      // Convert raw amount to human-readable
      const humanAmount = new BigNumber(token.amount || '0')
        .dividedBy(new BigNumber(10).pow(token.decimals));

      // Calculate USD value
      const valueUsd = humanAmount.multipliedBy(priceBN);
      totalValue = totalValue.plus(valueUsd);

      // Format with higher precision
      const amountStr   = humanAmount.toFixed(6);
      const priceStr    = priceBN.toFixed(6);    // show 6 decimal places
      const valueStr    = valueUsd.toFixed(6);   // show 6 decimal places

      breakdown.push({
        symbol:   token.symbol,
        amount:   amountStr,
        priceUsd: parseFloat(priceStr),
        valueUsd: valueUsd.toFixed(2), // or valueStr if you want 6dp everywhere
      });

      if (rawPrice > 0) {
        console.log(
          `[TVL] ${token.symbol}: ${humanAmount.toFixed(2)} × $${priceStr} = $${valueStr}`
        );
      }
    }
    console.log(pool.name, pool.tokens, totalValue)
    return {
      poolId:  pool.poolId,
      tvlUsd:  totalValue.toFixed(2),
      breakdown,
    };
  }
}
