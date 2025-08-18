import type { ProtocolMetricsDoc } from '$shared/typings/ProtocolMetrics';
import mongoose, { Model, Schema } from 'mongoose';

// ProtocolMetrics Schema
const ProtocolMetricsSchema = new Schema<ProtocolMetricsDoc>({
  protocolId: { type: String, required: true, unique: true, index: true }, // ensure unique and indexed
  apy7dAvg: { type: String }, // BigNumber string
  apyStd7d: { type: String }, // BigNumber string
  tvlChange7d: { type: String }, // BigNumber string (%)
  lastComputed: { type: Date, default: Date.now },
  // Add future aggregate metrics here as needed
});

export const ProtocolMetricsModel: Model<ProtocolMetricsDoc> =
  mongoose.models?.['ProtocolMetrics'] ??
  mongoose.model<ProtocolMetricsDoc>('ProtocolMetrics', ProtocolMetricsSchema);
