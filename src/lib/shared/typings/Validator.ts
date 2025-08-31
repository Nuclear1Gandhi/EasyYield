// src/shared/typings/Validator.ts
export interface ValidatorDoc {
  _id?: string;

  // Core Identity
  validatorAddress: string;
  name: string;
  description?: string;

  // LSU Token Information
  lsuTokenAddress: string;
  lsuTokenSymbol?: string; // e.g., "CaviarNine Singapore LSU"

  // Performance Metrics
  currentStake?: string; // XRD amount staked
  totalStakeUnits?: string;
  uptimePercentage?: number; // 30-day uptime
  averageApy?: string; // Historical APY

  // Risk & Quality Indicators
  isActive: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  slashingEvents: number;
  lastSlashDate?: Date;

  // Metadata
  operatorInfo?: {
    website?: string;
    location?: string;
    contact?: string;
  };

  // EasyYield Specific
  isRecommended: boolean;
  category: 'institutional' | 'community' | 'exchange';

  // Timestamps
  firstSeen: Date;
  lastUpdated: Date;
  lastDataSync?: Date;
}

// For API responses and display
export interface ValidatorDisplayData extends ValidatorDoc {
  // Computed fields for UI
  stakingApy?: number;
  riskScore?: number;
  performanceRank?: number;
  totalDelegators?: number;
}

// For validator creation/updates
export interface ValidatorCreateData {
  validatorAddress: string;
  name: string;
  description?: string;
  lsuTokenAddress: string;
  lsuTokenSymbol?: string;
  currentStake?: string;
  uptimePercentage?: number;
  averageApy?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  category?: 'institutional' | 'community' | 'exchange';
  operatorInfo?: {
    website?: string;
    location?: string;
    contact?: string;
  };
}

// For validator queries and filtering
export interface ValidatorFilters {
  isActive?: boolean;
  riskLevel?: 'low' | 'medium' | 'high' | Array<'low' | 'medium' | 'high'>;
  category?: 'institutional' | 'community' | 'exchange';
  minUptime?: number;
  minApy?: number;
  maxSlashingEvents?: number;
  isRecommended?: boolean;
}

// For validator performance analytics
export interface ValidatorPerformanceMetrics {
  validatorAddress: string;
  apy7d: number;
  apy30d: number;
  apy90d: number;
  uptimePercentage: number;
  slashingEvents: number;
  totalRewards: string;
  riskScore: number;
  performanceRank: number;
  lastUpdated: Date;
}

// For LSU pool relationships
export interface LSUPoolValidator {
  validatorAddress: string;
  name: string;
  lsuTokenAddress: string;
  lsuTokenSymbol: string;
  currentStake: string;
  averageApy: string;
  riskLevel: 'low' | 'medium' | 'high';
  isActive: boolean;
}

// Validator aggregation result types
export interface ValidatorStats {
  totalValidators: number;
  activeValidators: number;
  totalStake: string;
  averageApy: number;
  topValidatorsByStake: ValidatorDoc[];
  topValidatorsByApy: ValidatorDoc[];
}

// For validator sync operations
export interface ValidatorSyncResult {
  updated: number;
  created: number;
  errors: number;
  lastSync: Date;
  updatedValidators: string[];
}

// Enums for type safety
export enum ValidatorRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum ValidatorCategory {
  INSTITUTIONAL = 'institutional',
  COMMUNITY = 'community',
  EXCHANGE = 'exchange',
}

// Utility types for specific use cases
export type ValidatorIdentifier = Pick<
  ValidatorDoc,
  'validatorAddress' | 'name'
>;
export type ValidatorLSUInfo = Pick<
  ValidatorDoc,
  'validatorAddress' | 'lsuTokenAddress' | 'lsuTokenSymbol'
>;
export type ValidatorPerformance = Pick<
  ValidatorDoc,
  'validatorAddress' | 'averageApy' | 'uptimePercentage' | 'riskLevel'
>;
