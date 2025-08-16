import type { HistoricalYieldDoc } from '$shared/typings/HistoricalYield';
import mongoose, { Schema, Model } from 'mongoose';

// Mongoose schema
const HistoricalYieldSchema = new Schema<HistoricalYieldDoc>({
  protocolId: { type: String, index: true },
  apy: { type: String },
  tvl: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const HistoricalYieldModel: Model<HistoricalYieldDoc> =
  mongoose.models?.['HistoricalYield'] ??
  mongoose.model<HistoricalYieldDoc>('HistoricalYield', HistoricalYieldSchema);
