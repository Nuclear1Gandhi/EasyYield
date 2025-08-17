import { updateProtocolsJob } from '$server/jobs/updateProtocols/updateProtocols';
import 'dotenv/config'; // Load .env into process.env
import mongoose from 'mongoose';

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('🛑 MONGODB_URI not defined in environment');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB…');
    await mongoose.connect(uri);
    console.log('Running updateProtocolsJob…');
    const result = await updateProtocolsJob();
    console.log(
      `Finished: ${result?.updates} updates, ${result?.errors} errors`
    );
  } catch (err) {
    console.error('Error in updateProtocolsJob', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}
main().then(() => process.exit(0));
