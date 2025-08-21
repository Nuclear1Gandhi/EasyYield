import {
  YieldSourceType,
  type YieldSourceDoc,
} from '$shared/typings/YieldSource';
import mongoose, { Model, Schema } from 'mongoose';

const YieldSubSourceSchema = new Schema({
  type: {
    type: String,
    enum: [
      'staking_rewards',
      'trading_fees',
      'liquidity_incentives',
      'arbitrage_premium',
      'protocol_fees',
    ],
    required: true,
  },
  apy: { type: String, required: true },
  risk: {
    type: String,
    enum: ['low', 'medium', 'high', 'variable'],
    required: true,
  },
  description: { type: String, required: true },
  isActive: { type: Boolean, required: true },
  lastUpdated: { type: Date, required: true },
});

const RawPoolSchema = { type: Schema.Types.Mixed, required: true };

const YieldSourceSchema = new Schema<YieldSourceDoc>({
  yieldSourceId: { type: String, unique: true },
  name: { type: String },
  displayName: { type: String },
  type: {
    type: String,
    enum: Object.values(YieldSourceType),
  },
  currentApy: { type: String },
  tvl: { type: String },
  lastUpdated: { type: Date },

  dappIcon: { type: String }, // e.g., 'caviarnine', 'ociswap', 'radix'
  dappName: { type: String }, // e.g., 'CaviarNine', 'Ociswap'
  tokenIcons: [{ type: String }], // e.g., ['xrd', 'usdc'] for XRD/USDC pair
  tokenSymbols: [{ type: String }], // e.g., ['XRD', 'USDC']
  // Caviar or Ociswap pool structure - store all data here
  raw: RawPoolSchema,

  hasVault: {
    type: Boolean,
    default: false,
    index: true, // Index for efficient filtering
  },
  vaultCategory: {
    type: String,
    enum: ['PREMIUM_VAULT', 'BASIC_DEX'],
    default: 'BASIC_DEX',
  },
  isComposite: { type: Boolean, default: false },
  yieldSubSources: [YieldSubSourceSchema],
});

// Add compound indexes for efficient querying
YieldSourceSchema.index({ hasVault: 1, type: 1 });
YieldSourceSchema.index({ vaultCategory: 1, currentApy: -1 });
YieldSourceSchema.index({ hasVault: 1, tvl: -1 });

export const YieldSourceModel: Model<YieldSourceDoc> =
  mongoose.models?.['YieldSource'] ??
  mongoose.model<YieldSourceDoc>('YieldSource', YieldSourceSchema);
