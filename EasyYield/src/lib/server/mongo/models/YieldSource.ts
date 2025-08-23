import {
  Features,
  Protocols,
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

const YieldSourceSchema = new Schema<YieldSourceDoc<Protocols.CAVIARNINE>>({
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

  // Updated field names
  protocolIcon: { type: String },
  protocolName: { type: String },
  tokenIcons: [{ type: String }],
  tokenSymbols: [{ type: String }],

  // Unified yield structure
  isComposite: { type: Boolean, default: false },
  yieldSubSources: [YieldSubSourceSchema],

  // Unified features
  features: [
    {
      type: String,
      enum: Object.values(Features),
    },
  ],

  // Protocol-specific metadata (Mixed type for flexibility)
  protocolMetadata: {
    type: Schema.Types.Mixed,
    required: true,
  },

  // Raw data storage
  raw: RawPoolSchema,
});

// Add compound indexes for efficient querying
YieldSourceSchema.index({ hasVault: 1, type: 1 });
YieldSourceSchema.index({ vaultCategory: 1, currentApy: -1 });
YieldSourceSchema.index({ hasVault: 1, tvl: -1 });

export const YieldSourceModel: Model<YieldSourceDoc<Protocols.CAVIARNINE>> =
  mongoose.models?.['YieldSource'] ??
  mongoose.model('YieldSource', YieldSourceSchema);
