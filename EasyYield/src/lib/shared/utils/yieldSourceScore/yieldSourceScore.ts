import type { YieldSourceDisplayData } from '$shared/typings/Api';

interface YieldSourceScore {
  trustScore: number; // 0-40 points
  sustainabilityScore: number; // 0-30 points
  liquidityScore: number; // 0-20 points
  performanceScore: number; // 0-10 points
  totalScore: number; // 0-100 points
}

function calculateTokenLegitimacy(source: YieldSourceDisplayData): number {
  let score = 0;

  // XRD-based yields get maximum trust (25 points)
  if (source.type === 'xrd-staking' || source.tokenSymbols.includes('XRD')) {
    return 25;
  }

  // Known Radix ecosystem tokens (20 points)
  const radixTokens = ['LSU', 'HUG', 'OCI', 'FLOOP']; // Add more as ecosystem grows
  if (source.tokenSymbols.some((symbol) => radixTokens.includes(symbol))) {
    score += 20;
  }

  // Multi-token pools (more legitimate than single token farms) (10 points)
  if (source.tokenSymbols.length >= 2) {
    score += 10;
  } else {
    score += 5; // Single token gets half points
  }

  // Established dApp bonus (15 points max)
  const trustedDapps = ['CaviarNine', 'Ociswap', 'DefiPlaza', 'Astrolescent'];
  if (source.dappName && trustedDapps.includes(source.dappName)) {
    score += 15;
  }

  return Math.min(score, 25);
}

function calculateDataQuality(source: YieldSourceDisplayData): number {
  let score = 0;

  // Has historical data (5 points)
  if (source.apy7dAvg && source.apyStd7d) {
    score += 5;
  }

  // Recent update (3 points)
  const lastUpdate = new Date(source.lastUpdated);
  const hoursAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 1) score += 3;
  else if (hoursAgo < 6) score += 2;
  else if (hoursAgo < 24) score += 1;

  // Has visual assets (2 points)
  if (source.dappIcon && source.tokenIcons.length > 0) {
    score += 2;
  }

  return Math.min(score, 10);
}

function calculateTransparencyScore(source: YieldSourceDisplayData): number {
  let score = 5; // Base transparency score

  // Well-documented (has displayName) (2 points)
  if (source.displayName) score += 2;

  // Complete token information (3 points)
  if (
    source.tokenSymbols.length === source.tokenIcons.length &&
    source.tokenSymbols.length > 0
  ) {
    score += 3;
  }

  return Math.min(score, 5);
}

function calculateTrustScore(source: YieldSourceDisplayData): number {
  let score = 0;

  // Token/Protocol legitimacy (25 points max)
  score += calculateTokenLegitimacy(source);

  // Data availability/completeness (10 points max)
  score += calculateDataQuality(source);

  // Security through transparency (5 points max)
  score += calculateTransparencyScore(source);

  return Math.min(score, 40);
}

function calculateSustainabilityScore(source: YieldSourceDisplayData): number {
  let score = 0;
  const currentApy = parseFloat(source.currentApy || '0');

  // APY reality check (15 points max)
  if (currentApy <= 12)
    score += 15; // Very realistic
  else if (currentApy <= 20)
    score += 12; // Realistic
  else if (currentApy <= 30)
    score += 8; // High but possible
  else if (currentApy <= 50)
    score += 4; // Suspicious
  else score += 0; // Likely scam

  // Yield stability (10 points max)
  if (source.status === 'growing') score += 10;
  else if (source.status === 'stable') score += 7;
  else if (source.status === 'volatile') score += 3;

  // Historical consistency (5 points max)
  if (source.apy7dAvg && source.currentApy) {
    const avg7d = parseFloat(source.apy7dAvg);
    const current = parseFloat(source.currentApy);
    const deviation = Math.abs(current - avg7d) / avg7d;

    if (deviation < 0.1)
      score += 5; // Very consistent
    else if (deviation < 0.2)
      score += 3; // Somewhat consistent
    else if (deviation < 0.5) score += 1; // Moderately volatile
  }

  return Math.min(score, 30);
}

function applyRedFlagPenalties(
  baseScore: number,
  source: YieldSourceDisplayData
): number {
  let penalties = 0;
  const currentApy = parseFloat(source.currentApy || '0');

  // Extreme APY penalties
  if (currentApy > 100)
    penalties += 40; // Obvious scam
  else if (currentApy > 50) penalties += 20; // Very suspicious

  // Volatility penalty
  if (source.status === 'volatile' && currentApy > 25) {
    penalties += 15; // High APY + volatile = red flag
  }

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

  // Base for active status (2 points)
  if (source.status === 'growing') {
    score += 2;
  } else if (source.status === 'stable') {
    score += 1;
  }

  // Low volatility bonus (4 points max)
  // volatility is standard deviation of APY over 7 days
  const vol = source.volatility ?? parseFloat(source.apyStd7d || '0');
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
    const current = parseFloat(source.currentApy);
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
  const trustScore = applyRedFlagPenalties(calculateTrustScore(source), source);
  const sustainabilityScore = calculateSustainabilityScore(source);
  const liquidityScore = calculateLiquidityScore(source);
  const performanceScore = calculatePerformanceScore(source);

  return {
    trustScore,
    sustainabilityScore,
    liquidityScore,
    performanceScore,
    totalScore:
      trustScore + sustainabilityScore + liquidityScore + performanceScore,
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
