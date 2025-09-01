import type { YieldSourceMetricsDoc } from '$shared/typings/YieldSourceMetrics';
import mongoose, { Model, Schema } from 'mongoose';

// YieldSourceMetrics Schema
const YieldSourceMetrics = new Schema<YieldSourceMetricsDoc>({
  yieldSourceAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
  }, // ensure unique and indexed
  apy7dAvg: { type: String }, // BigNumber string
  apyStd7d: { type: String }, // BigNumber string
  tvlChange7d: { type: String }, // BigNumber string (%)
  lastComputed: { type: Date, default: Date.now },
  // Add future aggregate metrics here as needed
});

export const YieldSourceMetricsModel: Model<YieldSourceMetricsDoc> =
  mongoose.models?.['YieldSourceMetrics'] ??
  mongoose.model<YieldSourceMetricsDoc>(
    'YieldSourceMetrics',
    YieldSourceMetrics
  );
