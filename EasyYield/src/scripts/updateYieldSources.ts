import { updateYieldSourcesJob } from '$server/jobs/updateYieldSources/updateYieldSources';
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
    await mongoose.connect(uri, {
        dbName: process.env.MONGODB_DB_NAME || undefined, 
    });
    console.log('Running updateYieldSourcesJob…');
    const result = await updateYieldSourcesJob();
    console.log(
      `Finished: ${result?.updates} updates, ${result?.errors} errors`
    );
  } catch (err) {
    console.error('Error in updateYieldSourcesJob…', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}
main().then(() => process.exit(0));
