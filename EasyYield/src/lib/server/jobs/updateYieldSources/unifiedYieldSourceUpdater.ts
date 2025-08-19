// src/server/jobs/updateYieldSources/unifiedYieldSourceUpdater.ts
import BigNumber from 'bignumber.js';
import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { YieldSourceModel } from '$server/mongo/models/YieldSource';
import { YieldSourceType } from '$shared/typings/YieldSource';
import { batchProcessYieldSources } from './yieldSourceProcessor';

interface RawYieldSource {
  id: string;
  originalName: string;
  type: YieldSourceType;
  rawApy: string | number;
  rawTvl: string | number;
  rawData: any;
}

interface UpdateResult {
  updates: number;
  errors: number;
  updatedIds: string[];
}

export async function updateYieldSourcesBatch(
  rawYieldSources: RawYieldSource[],
  sourceName: string
): Promise<UpdateResult> {
  if (rawYieldSources.length === 0) {
    console.log(`[INFO] No ${sourceName} yield sources to process`);
    return { updates: 0, errors: 0, updatedIds: [] };
  }

  // ✅ STEP 1: Prepare data for batch processing
  const yieldSourcesForProcessing = rawYieldSources.map((source) => ({
    id: source.id,
    originalName: source.originalName,
    yieldSourceType: source.type,
  }));

  // ✅ STEP 2: Batch process all names and icons
  console.log(
    `[INFO] Processing ${rawYieldSources.length} ${sourceName} yield sources...`
  );
  const startTime = Date.now();
  const processedData = await batchProcessYieldSources(
    yieldSourcesForProcessing
  );
  console.log(
    `[INFO] ${sourceName} batch processing completed in ${Date.now() - startTime}ms`
  );

  // ✅ STEP 3: Update database with processed data
  let updates = 0;
  let errors = 0;
  const updatedIds: string[] = [];
  const now = new Date();

  for (const source of rawYieldSources) {
    try {
      // ✅ Process APY and TVL with BigNumber precision (unified logic)
      const apyBn = new BigNumber(source.rawApy.toString() || '0');
      const tvlBn = new BigNumber(source.rawTvl.toString() || '0');

      const apy = apyBn.decimalPlaces(6, BigNumber.ROUND_DOWN);
      const tvl = tvlBn.decimalPlaces(0, BigNumber.ROUND_DOWN);

      // ✅ Get processed name and icon data
      const processedResult = processedData.get(source.id);
      if (!processedResult) {
        throw new Error(
          `No processed data found for ${sourceName} source ${source.id}`
        );
      }

      // ✅ Unified database update
      await YieldSourceModel.findOneAndUpdate(
        { yieldSourceId: source.id },
        {
          $set: {
            name: source.originalName,

            // Processed data from unified processor
            displayName: processedResult.displayName,
            description: processedResult.description,
            tokenSymbols: processedResult.tokenSymbols,
            dappIcon: processedResult.dappIcon,
            dappName: processedResult.dappName,
            tokenIcons: processedResult.tokenIcons,

            type: source.type,
            currentApy: apy.toString(),
            tvl: tvl.toString(),
            lastUpdated: now,
            raw: source.rawData,
          },
        },
        { upsert: true, new: true }
      );

      // ✅ Unified historical yield tracking
      await HistoricalYieldModel.create({
        yieldSourceId: source.id,
        apy: apy.toNumber(),
        tvl: tvl.toNumber(),
        timestamp: now,
      });

      updatedIds.push(source.id);
      updates++;
    } catch (err) {
      errors++;
      console.error(
        `[FAIL] Could not update ${sourceName} source ${source.id}:`,
        err
      );
    }
  }

  console.log(`[SUCCESS] ${sourceName}: ${updates} updated, ${errors} errors`);
  return { updates, errors, updatedIds };
}
