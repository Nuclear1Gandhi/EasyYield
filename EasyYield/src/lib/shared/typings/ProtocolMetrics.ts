import type { Document } from 'mongoose';

export interface ProtocolMetricsDoc extends Document {
  protocolId: string; // Reference to Protocol
  apy7dAvg: string;
  apyStd7d: string;
  tvlChange7d: string;
  lastComputed: Date;
}
