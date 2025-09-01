// src/shared/utils/validatorRiskScore.ts
import type { ValidatorDoc } from '$shared/typings/Validator';

export interface RiskFactors {
  slashingPenalty: number;
  uptimeFactor: number;
  stakeFactor: number;
  apyFactor: number;
  totalScore: number;
}

/**
 * Calculate a numeric risk score for a validator based on key factors.
 * Lower score = lower risk, higher score = higher risk
 *
 * @param validator - Validator document with performance metrics
 * @returns Risk score (0-5+, where 0 is lowest risk)
 */
export function calculateRiskScore(validator: ValidatorDoc): number {
  const slashingEvents = validator.slashingEvents || 0;
  const uptime = validator.uptimePercentage || 100;
  const currentStake = parseFloat(validator.currentStake || '0');
  const averageApy = parseFloat(validator.averageApy || '0');

  // Configuration constants
  const MAX_STAKE_FOR_SCALING = 1_000_000; // XRD - adjust based on network
  const SLASHING_PENALTY_WEIGHT = 0.5; // Each slashing event adds 0.5 risk
  const HIGH_APY_THRESHOLD = 15; // APY above this adds slight risk
  const LOW_APY_THRESHOLD = 3; // APY below this adds slight risk

  // 1. Slashing penalty (0.5 per event)
  const slashingPenalty = slashingEvents * SLASHING_PENALTY_WEIGHT;

  // 2. Uptime factor (0-1, where 0=perfect uptime, 1=terrible uptime)
  const uptimeFactor = Math.max(0, (100 - uptime) / 100);

  // 3. Stake factor (0-1, where 0=high stake, 1=low stake)
  const stakeFactor = Math.max(0, 1 - currentStake / MAX_STAKE_FOR_SCALING);

  // 4. APY factor (penalize extremes)
  let apyFactor = 0;
  if (averageApy > HIGH_APY_THRESHOLD) {
    apyFactor = (averageApy - HIGH_APY_THRESHOLD) * 0.02; // Slight penalty for very high APY
  } else if (averageApy < LOW_APY_THRESHOLD && averageApy > 0) {
    apyFactor = (LOW_APY_THRESHOLD - averageApy) * 0.1; // Penalty for suspiciously low APY
  }

  // 5. Time-based factors
  const daysSinceLastSlash = validator.lastSlashDate
    ? (Date.now() - validator.lastSlashDate.getTime()) / (1000 * 60 * 60 * 24)
    : Infinity;

  const recentSlashPenalty = daysSinceLastSlash < 30 ? 0.3 : 0; // Recent slashing adds risk

  // Calculate total risk score
  const totalScore =
    slashingPenalty +
    uptimeFactor +
    stakeFactor +
    apyFactor +
    recentSlashPenalty;

  return Math.round(totalScore * 1000) / 1000; // Round to 3 decimal places
}

/**
 * Map numeric risk score to categorical risk level
 */
export function mapRiskScoreToLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 0.5) return 'low';
  if (score < 1.5) return 'medium';
  return 'high';
}

/**
 * Get detailed risk breakdown for UI display
 */
export function getRiskFactorsBreakdown(validator: ValidatorDoc): RiskFactors {
  const slashingEvents = validator.slashingEvents || 0;
  const uptime = validator.uptimePercentage || 100;
  const currentStake = parseFloat(validator.currentStake || '0');
  const averageApy = parseFloat(validator.averageApy || '0');

  const slashingPenalty = slashingEvents * 0.5;
  const uptimeFactor = Math.max(0, (100 - uptime) / 100);
  const stakeFactor = Math.max(0, 1 - currentStake / 1_000_000);

  let apyFactor = 0;
  if (averageApy > 15) {
    apyFactor = (averageApy - 15) * 0.02;
  } else if (averageApy < 3 && averageApy > 0) {
    apyFactor = (3 - averageApy) * 0.1;
  }

  const totalScore = slashingPenalty + uptimeFactor + stakeFactor + apyFactor;

  return {
    slashingPenalty,
    uptimeFactor,
    stakeFactor,
    apyFactor,
    totalScore: Math.round(totalScore * 1000) / 1000,
  };
}

/**
 * Enhanced risk assessment with recommendation logic
 */
export function assessValidatorRisk(validator: ValidatorDoc): {
  score: number;
  level: 'low' | 'medium' | 'high';
  isRecommended: boolean;
  reasoning: string[];
  factors: RiskFactors;
} {
  const score = calculateRiskScore(validator);
  const level = mapRiskScoreToLevel(score);
  const factors = getRiskFactorsBreakdown(validator);

  const reasoning: string[] = [];
  let isRecommended = validator.isActive;

  // Build reasoning
  if (validator.slashingEvents === 0) {
    reasoning.push('No slashing history');
  } else if (validator.slashingEvents > 3) {
    reasoning.push(`High slashing risk (${validator.slashingEvents} events)`);
    isRecommended = false;
  }

  if ((validator.uptimePercentage || 0) >= 98) {
    reasoning.push('Excellent uptime');
  } else if ((validator.uptimePercentage || 0) < 95) {
    reasoning.push('Below average uptime');
    isRecommended = false;
  }

  const stake = parseFloat(validator.currentStake || '0');
  if (stake > 500_000) {
    reasoning.push('High stake amount');
  } else if (stake < 50_000) {
    reasoning.push('Low stake amount');
  }

  return {
    score,
    level,
    isRecommended: isRecommended && level !== 'high',
    reasoning,
    factors,
  };
}
