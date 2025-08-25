import { BigNumber } from 'bignumber.js';

export interface APYResult {
  poolId: string;
  totalApy: string;
  apyBreakdown: Array<{
    type: 'trading_fees' | 'staking_rewards' | 'liquidity_incentives' | 'protocol_rewards';
    apy: string;
    description: string;
    risk: 'low' | 'medium' | 'high';
    isActive: boolean;
  }>;
  isComposite: boolean;
}

export class RadixAPYProcessor {
  async processAllPools(pools: any[], tvlResults: Map<string, any>): Promise<Map<string, APYResult>> {
    console.log(`[APY] Processing APY for ${pools.length} pools`);
    
    const results = new Map<string, APYResult>();
    
    for (const pool of pools) {
      try {
        const tvlResult = tvlResults.get(pool.poolId);
        const apyResult = await this.calculatePoolAPY(pool, tvlResult);
        results.set(pool.poolId, apyResult);
      } catch (error) {
        console.error(`[APY] Error calculating APY for pool ${pool.poolId}:`, error);
        results.set(pool.poolId, {
          poolId: pool.poolId,
          totalApy: '0',
          apyBreakdown: [],
          isComposite: false,
        });
      }
    }
    
    console.log(`[APY] Successfully calculated APY for ${results.size} pools`);
    return results;
  }
  
  private async calculatePoolAPY(pool: any, tvlResult: any): Promise<APYResult> {
    const breakdown: APYResult['apyBreakdown'] = [];
    
    switch (pool.poolType) {
      case 'LSU_POOL':
        breakdown.push(...await this.calculateLSUPoolAPY(pool, tvlResult));
        break;
        
      case 'HYPERSTAKE':
        breakdown.push(...await this.calculateHyperStakeAPY(pool, tvlResult));
        break;
        
      case 'TICKER':
        breakdown.push(...await this.calculateTickerAPY(pool, tvlResult));
        break;
        
      default:
        breakdown.push({
          type: 'trading_fees',
          apy: '0',
          description: 'Unknown pool type',
          risk: 'medium',
          isActive: false,
        });
    }
    
    // Calculate total APY
    const totalApy = breakdown
      .filter(b => b.isActive)
      .reduce((sum, b) => sum + parseFloat(b.apy), 0);
    
    return {
      poolId: pool.poolId,
      totalApy: totalApy.toFixed(2),
      apyBreakdown: breakdown,
      isComposite: breakdown.length > 1,
    };
  }
  
  private async calculateLSUPoolAPY(pool: any, tvlResult: any): Promise<APYResult['apyBreakdown']> {
    const breakdown: APYResult['apyBreakdown'] = [];
    
    // Base staking rewards - use current Radix network staking rate
    breakdown.push({
      type: 'staking_rewards',
      apy: await this.getCurrentStakingRate(),
      description: 'Radix network staking rewards',
      risk: 'low',
      isActive: true,
    });
    
    // Trading fees based on volume and TVL
    if (tvlResult && parseFloat(tvlResult.tvlUsd) > 0) {
      const volume24h = this.extractVolume24h(pool);
      const tradingFeesApy = this.calculateTradingFeesAPY(volume24h, parseFloat(tvlResult.tvlUsd));
      
      breakdown.push({
        type: 'trading_fees',
        apy: tradingFeesApy.toFixed(2),
        description: 'LSU token trading fees',
        risk: 'medium',
        isActive: tradingFeesApy > 0,
      });
    }
    
    // Protocol incentives (if vault pool)
    if (pool.hasVault) {
      breakdown.push({
        type: 'liquidity_incentives',
        apy: '1.5', // This could be fetched from protocol APIs
        description: 'Protocol liquidity incentives',
        risk: 'medium',
        isActive: true,
      });
    }
    
    return breakdown;
  }
  
  private async calculateHyperStakeAPY(pool: any, tvlResult: any): Promise<APYResult['apyBreakdown']> {
    const breakdown: APYResult['apyBreakdown'] = [];
    
    // Concentrated liquidity premium
    breakdown.push({
      type: 'staking_rewards',
      apy: await this.getCurrentStakingRate(),
      description: 'Base staking rewards',
      risk: 'low',
      isActive: true,
    });
    
    // Higher trading fees due to concentrated liquidity
    if (tvlResult && parseFloat(tvlResult.tvlUsd) > 0) {
      const volume24h = this.extractVolume24h(pool);
      const baseTradingApy = this.calculateTradingFeesAPY(volume24h, parseFloat(tvlResult.tvlUsd));
      const concentratedMultiplier = 3; // Concentrated liquidity earns more fees
      
      breakdown.push({
        type: 'trading_fees',
        apy: (baseTradingApy * concentratedMultiplier).toFixed(2),
        description: 'Enhanced trading fees from concentrated liquidity',
        risk: 'medium',
        isActive: baseTradingApy > 0,
      });
    }
    
    // Protocol rewards for HyperStake
    breakdown.push({
      type: 'protocol_rewards',
      apy: '2.0',
      description: 'HyperStake protocol incentives',
      risk: 'medium',
      isActive: true,
    });
    
    return breakdown;
  }
  
  private async calculateTickerAPY(pool: any, tvlResult: any): Promise<APYResult['apyBreakdown']> {
    const breakdown: APYResult['apyBreakdown'] = [];
    
    // Standard DEX trading fees
    if (tvlResult && parseFloat(tvlResult.tvlUsd) > 0) {
      const volume24h = this.extractVolume24h(pool);
      const tradingFeesApy = this.calculateTradingFeesAPY(volume24h, parseFloat(tvlResult.tvlUsd));
      
      breakdown.push({
        type: 'trading_fees',
        apy: tradingFeesApy.toFixed(2),
        description: pool.hasVault ? 'Enhanced DEX trading fees' : 'Standard DEX trading fees',
        risk: 'medium',
        isActive: tradingFeesApy > 0,
      });
    }
    
    // Vault benefits
    if (pool.hasVault) {
      breakdown.push({
        type: 'protocol_rewards',
        apy: '0.8',
        description: 'Vault participant rewards',
        risk: 'low',
        isActive: true,
      });
    }
    
    return breakdown;
  }
  
  private calculateTradingFeesAPY(volume24h: number, tvlUsd: number): number {
    if (tvlUsd === 0) return 0;
    
    const swapFee = 0.003; // 0.3% typical swap fee
    const dailyFees = volume24h * swapFee;
    const annualFees = dailyFees * 365;
    const apy = (annualFees / tvlUsd) * 100;
    
    return apy;
  }
  
  private extractVolume24h(pool: any): number {
    // Extract 24h volume from raw API data
    if (pool.rawApiData?.ticker?.base_volume) {
      return parseFloat(pool.rawApiData.ticker.base_volume) || 0;
    }
    
    // Fallback: estimate from TVL
    if (pool.rawApiData?.tvl) {
      return parseFloat(pool.rawApiData.tvl) * 0.1; // 10% daily turnover estimate
    }
    
    return 0;
  }
  
  private async getCurrentStakingRate(): Promise<string> {
    // TODO: Fetch current Radix network staking rate from Gateway or validators
    // For now, return a reasonable estimate
    return '4.5'; // 4.5% current Radix staking rewards
  }
}
