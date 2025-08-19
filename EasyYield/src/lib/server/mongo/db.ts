import mongoose from 'mongoose';
import { YieldSourceModel } from './models/YieldSource';
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
  await YieldSourceModel.collection.createIndex(
    { yieldSourceId: 1 },
    { unique: true }
  );
  await YieldSourceModel.collection.createIndex({ type: 1, currentApy: -1 });

  isConnected = true;
}
