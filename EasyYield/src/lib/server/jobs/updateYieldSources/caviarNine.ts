import { getCaviarNineRawData } from "$server/api/caviarNine/pools";
import { RadixAPYProcessor } from "$server/services/source/statProcessor/apyProcessor";
import { RadixMetadataProcessor } from "$server/services/source/statProcessor/metadataProcessor";
import { TVLProcessor } from "$server/services/source/statProcessor/tvlProcessor";
import { Dapps } from "$shared/typings/YieldSource";
import { updateYieldSourcesBatch } from "./unifiedYieldSourceUpdater";

export async function updateCaviarNineYieldSources() {
  console.log('[CAVIAR-UPDATE] Starting CaviarNine yield sources update...');

  try {
    // 1. Extract unified raw pool data
    const rawPools = await getCaviarNineRawData();
    console.log(`[CAVIAR-UPDATE] Extracted ${rawPools.length} unified pools`);
    
    // 2. Process metadata FIRST (to get correct decimals and symbols)
    const metadataProcessor = new RadixMetadataProcessor();
    const metadataResults = await metadataProcessor.processAllPools(rawPools);
    
    // 3. Process TVL (using updated metadata)
    const tvlProcessor = new TVLProcessor();
    const tvlResults = await tvlProcessor.processAllPools(rawPools);
    
    // 4. Process APY (using TVL results for trading fee calculations)
    const apyProcessor = new RadixAPYProcessor();
    const apyResults = await apyProcessor.processAllPools(rawPools, tvlResults);
    
    // 5. Transform to final yield sources format
    const rawYieldSources = rawPools.map((pool) => {
      const tvlResult = tvlResults.get(pool.poolId);
      const apyResult = apyResults.get(pool.poolId);
      const metadata = metadataResults.get(pool.poolId);
      
      return {
        id: pool.poolId,
        originalName: metadata?.displayName || pool.name || pool.poolId.slice(-8),
        type: pool.type,
        rawApy: apyResult?.totalApy || '0',
        rawTvl: tvlResult?.tvlUsd || '0',
        rawData: {
          ...pool.rawData,
          tvl: tvlResult?.tvlUsd || '0',
          tvlBreakdown: tvlResult?.breakdown,
          currentApy: apyResult?.totalApy || '0',
          yieldSubSources: apyResult?.apyBreakdown || [],
          isComposite: apyResult?.isComposite || false,
          metadata: metadata,
        },
      };
    });

    // 6. Save to database
    return updateYieldSourcesBatch<Dapps.CAVIARNINE>(
      rawYieldSources,
      Dapps.CAVIARNINE
    );

  } catch (error) {
    console.error('[CAVIAR-UPDATE] Update failed:', error);
    throw error;
  }
}
