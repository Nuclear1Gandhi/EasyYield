import {
  Features,
  Dapps,
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
  },
  apy: { type: String },
  fee: { type: String },
  risk: {
    type: String,
    enum: ['low', 'medium', 'high', 'variable'],
  },
  description: { type: String },
  isActive: { type: Boolean },
  lastUpdated: { type: Date },
});

const PoolInfoFungibleResourceSchema = new Schema({
  resourceAddress: { type: String },
  amount: { type: String }, // keep as string for precision
  vaultAddress: { type: String },

  // TokenMetadata fields (example subset, adjust as per actual TokenMetadata)
  symbol: { type: String, trim: true },
  name: { type: String },
  description: { type: String },
  iconUrl: { type: String },
  decimals: { type: Number },
  // Additional enriched field
  price: { type: Number },
});

const RawPoolSchema = { type: Schema.Types.Mixed };

const YieldSourceSchema = new Schema<YieldSourceDoc<Dapps.CAVIARNINE>>({
  yieldSourceAddress: { type: String, unique: true },
  name: { type: String },
  type: {
    type: String,
    enum: Object.values(YieldSourceType),
  },
  apy: { type: String },
  tvl: { type: String },
  lastUpdated: { type: Date },
  // Updated field names
  dappIcon: { type: String },
  dapp: { type: String },
  tokens: [PoolInfoFungibleResourceSchema],

  volume24h: { type: String },
  // Unified yield structure
  isComposite: { type: Boolean, default: false },
  yieldSubSources: [YieldSubSourceSchema],

  // Unified features
  features: [
    {
      type: String,
    },
  ],

  // Raw data storage
  raw: RawPoolSchema,
});

// Add compound indexes for efficient querying
YieldSourceSchema.index({ hasVault: 1, type: 1 });
YieldSourceSchema.index({ vaultCategory: 1, currentApy: -1 });
YieldSourceSchema.index({ hasVault: 1, tvl: -1 });

export const YieldSourceModel: Model<YieldSourceDoc<Dapps.CAVIARNINE>> =
  mongoose.models?.['YieldSource'] ??
  mongoose.model('YieldSource', YieldSourceSchema);
