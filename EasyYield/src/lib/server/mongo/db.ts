import mongoose from 'mongoose';
import { ProtocolModel } from './models/Protocol';
import { configDotenv } from 'dotenv';

configDotenv();

let isConnected = false;

export async function connectToDatabase() {
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI as string, {
    dbName: process.env.MONGODB_DB_NAME || undefined,
  });

  // Create indexes after connection
  await ProtocolModel.collection.createIndex(
    { protocolId: 1 },
    { unique: true }
  );
  await ProtocolModel.collection.createIndex({ type: 1, currentApy: -1 });

  isConnected = true;
}
