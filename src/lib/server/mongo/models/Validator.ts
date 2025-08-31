import type { ValidatorDoc } from '$shared/typings/Validator';
import mongoose, { Model, Schema } from 'mongoose';

// Validator Collection Schema
const ValidatorSchema = new Schema<ValidatorDoc>({
  // Core Identity
  validatorAddress: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  description: { type: String },

  // LSU Token Information
  lsuTokenAddress: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  lsuTokenSymbol: { type: String }, // e.g., "CaviarNine Singapore LSU"

  // Performance Metrics
  currentStake: { type: String }, // XRD amount staked
  totalStakeUnits: { type: String },
  uptimePercentage: { type: Number }, // 30-day uptime
  averageApy: { type: String }, // Historical APY

  // Risk & Quality Indicators
  isActive: { type: Boolean, default: true },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  slashingEvents: { type: Number, default: 0 },
  lastSlashDate: { type: Date },

  // Metadata
  operatorInfo: {
    website: { type: String },
    location: { type: String },
    contact: { type: String },
  },

  // EasyYield Specific
  isRecommended: { type: Boolean, default: false },
  category: {
    type: String,
    enum: ['institutional', 'community', 'exchange'],
    default: 'community',
  },

  // Timestamps
  firstSeen: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  lastDataSync: { type: Date },
});

// Add compound indexes for efficient querying
ValidatorSchema.index({ isActive: 1, riskLevel: 1 });
ValidatorSchema.index({ averageApy: -1, isActive: 1 });
ValidatorSchema.index({ currentStake: -1, uptimePercentage: -1 });

export const ValidatorModel: Model<ValidatorDoc> =
  mongoose.models?.['Validator'] ??
  mongoose.model<ValidatorDoc>('Validator', ValidatorSchema);
