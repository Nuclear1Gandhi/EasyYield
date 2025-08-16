import { ProtocolType, type ProtocolDoc } from '$shared/typings/Protocol';
import mongoose, { Model, Schema } from 'mongoose';

const RawPoolSchema = { type: Schema.Types.Mixed, required: true };

const ProtocolSchema = new Schema<ProtocolDoc>({
  protocolId: { type: String, unique: true },
  name: { type: String },
  type: {
    type: String,
    enum: Object.values(ProtocolType),
  },
  currentApy: { type: String },
  tvl: { type: String },
  lastUpdated: { type: Date },

  // Ociswap pool structure - store all data here
  raw: RawPoolSchema,
});

export const ProtocolModel: Model<ProtocolDoc> =
  mongoose.models?.['Protocol'] ??
  mongoose.model<ProtocolDoc>('Protocol', ProtocolSchema);
