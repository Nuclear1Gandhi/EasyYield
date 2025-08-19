import {
  YieldSourceType,
  type YieldSourceDoc,
} from '$shared/typings/YieldSource';
import mongoose, { Model, Schema } from 'mongoose';

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
});

export const YieldSourceModel: Model<YieldSourceDoc> =
  mongoose.models?.['YieldSource'] ??
  mongoose.model<YieldSourceDoc>('YieldSource', YieldSourceSchema);
