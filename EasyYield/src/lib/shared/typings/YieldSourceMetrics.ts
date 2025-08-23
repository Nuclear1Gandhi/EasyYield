import type { Document } from 'mongoose';

export interface YieldSourceMetricsDoc extends Document {
  yieldSourceId: string; // Reference to Yield Source
  apy7dAvg: string;
  apyStd7d: string;
  tvlChange7d: string;
  lastComputed: Date;
}
