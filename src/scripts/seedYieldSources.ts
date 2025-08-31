import mongoose from 'mongoose';
import { YieldSourceModel } from '../lib/server/mongo/models/YieldSource';
import { YieldSourceType } from '$shared/typings/YieldSource';
import { configDotenv } from 'dotenv';
import { fetchTopOciswapPools } from '$server/api/ociswap/pools';

configDotenv();

// Call this at the very start of your seed function:
async function cleanupYieldSources() {
  const deleted = await YieldSourceModel.deleteMany({});
  console.log(
    `[CLEANUP] Deleted ${deleted.deletedCount} yield sources from the DB.`
  );
}

export async function seedYieldSources() {
  try {
    await cleanupYieldSources();

    // Insert CaviarNine
    console.log('\x1b[34m[INFO]\x1b[0m Inserting CaviarNine LSU Pool…');
    // const caviar = await YieldSourceModel.create({
    //   name: 'CaviarNine LSU Pool',
    //   type: YieldSourceType.LSU_POOL,
    //   yieldSourceId: CaviarNineAddress.LSU_POOL,
    //   raw: undefined,
    // });
    console.log(
      '\x1b[32m[SUCCESS]\x1b[0m Inserted:'
      // caviar.name,
      // caviar.yieldSourceId
    );

    // Insert all Ociswap pools
    let ociswapCount = 0;

    const pools = await fetchTopOciswapPools();
    for (const pool of pools) {
      const doc = await YieldSourceModel.create({
        yieldSourceId: pool.address,
        name: pool.name,
        type: YieldSourceType.DEX_PAIR,
        currentApy: pool.apr['24h'],
        tvl: pool.total_value_locked.usd.now,
        lastUpdated: new Date(),
        raw: pool, // <-- the full pool object
      });
      ociswapCount++;
      console.log(
        `\x1b[32m[SUCCESS]\x1b[0m Inserted: ${doc.name} (${doc.yieldSourceAddress})`
      );
    }
    console.log(
      `\x1b[32m[FINISHED]\x1b[0m Seeded yield sources! Inserted 1 CaviarNine + ${ociswapCount} Ociswap pools.`
    );
  } catch (err) {
    console.error('\x1b[31m[ERROR]\x1b[0m Failed seeding yield sources:', err);
  }
}
/* You need to call to run the import instead of just running on import */
if (import.meta.main) {
  console.log('\x1b[34m[INFO]\x1b[0m Connecting to MongoDB…');
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('\x1b[32m[SUCCESS]\x1b[0m Connected to MongoDB.');

  seedYieldSources();
}
