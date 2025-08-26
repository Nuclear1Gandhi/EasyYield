import type { YieldSourceDisplayData } from '$shared/typings/Api';

interface YieldSourceScore {
  trustScore: number; // 0-40 points
  sustainabilityScore: number; // 0-30 points
  liquidityScore: number; // 0-20 points
  performanceScore: number; // 0-10 points
  totalScore: number; // 0-100 points
}

function applyRedFlagPenalties(
  baseScore: number,
  source: YieldSourceDisplayData
): number {
  let penalties = 0;
  const currentApy = parseFloat(source.apy || '0');

  // Extreme APY penalties
  if (currentApy > 100)
    penalties += 40; // Obvious scam
  else if (currentApy > 50) penalties += 20; // Very suspicious

  // Data staleness penalty
  const lastUpdate = new Date(source.lastUpdated);
  const hoursAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
  if (hoursAgo > 48) penalties += 10; // Old data

  // Missing critical data
  if (!source.tvl || parseFloat(source.tvl) === 0) {
    penalties += 15; // No TVL data is suspicious
  }

  return Math.max(0, baseScore - penalties);
}

/**
 * Liquidity Score (20% weight) – Prioritizes sources with deeper, growing TVL.
 */
function calculateLiquidityScore(source: YieldSourceDisplayData): number {
  let score = 0;

  // Parse TVL
  const tvl = parseFloat(source.tvl || '0');

  // TVL tiers (15 points max)
  if (tvl >= 5_000_000) {
    score += 15; // Deep liquidity
  } else if (tvl >= 1_000_000) {
    score += 12; // Very good
  } else if (tvl >= 100_000) {
    score += 8; // Good
  } else if (tvl >= 10_000) {
    score += 4; // Modest
  }

  // 7-day TVL change bonus/penalty (5 points max)
  const change7d = parseFloat(source.tvlChange7d || '0');
  if (change7d > 10) {
    score += 5; // Strong inflows
  } else if (change7d > 0) {
    score += 3; // Modest inflows
  } else if (change7d < -10) {
    score += 0; // Rapid outflows
  } else if (change7d < 0) {
    score += 1; // Mild outflows
  }

  return Math.min(score, 20);
}

/**
 * Performance Score (10% weight) – Rewards consistent, stable yield performance.
 */
function calculatePerformanceScore(source: YieldSourceDisplayData): number {
  let score = 0;

  // Low volatility bonus (4 points max)
  // volatility is standard deviation of APY over 7 days
  const vol = parseFloat(source.apyStd7d || '0');
  if (vol < 1) {
    score += 4; // Very stable
  } else if (vol < 2) {
    score += 3; // Stable
  } else if (vol < 5) {
    score += 2; // Moderate
  } else if (vol < 10) {
    score += 1; // Volatile
  }

  // Consistency vs. 7-day average (4 points max)
  if (source.apy7dAvg != null) {
    const avg7d = parseFloat(source.apy7dAvg);
    const current = parseFloat(source.apy);
    const diffPct = Math.abs(current - avg7d) / Math.max(1, avg7d);
    if (diffPct < 0.05) {
      score += 4; // Very consistent
    } else if (diffPct < 0.1) {
      score += 3; // Consistent
    } else if (diffPct < 0.2) {
      score += 2; // Some fluctuation
    } else if (diffPct < 0.3) {
      score += 1; // Unstable
    }
  }

  return Math.min(score, 10);
}

export function calculateYieldScore(
  source: YieldSourceDisplayData
): YieldSourceScore {
  const trustScore = applyRedFlagPenalties(100, source);
  const liquidityScore = calculateLiquidityScore(source);
  const performanceScore = calculatePerformanceScore(source);

  return {
    trustScore,
    liquidityScore,
    performanceScore,
    totalScore: trustScore + liquidityScore + performanceScore,
  };
}

/**
 * Sort yield sources by score (desc), breaking ties by TVL desc.
 */
export function sortYieldSources(
  sources: YieldSourceDisplayData[]
): YieldSourceDisplayData[] {
  return sources
    .map((src) => ({ ...src, _score: calculateYieldScore(src) }))
    .sort((a, b) => {
      const diff = b._score.totalScore - a._score.totalScore;
      if (Math.abs(diff) >= 1) return diff;
      return parseFloat(b.tvl) - parseFloat(a.tvl);
    });
}
