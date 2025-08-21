import BigNumber from 'bignumber.js';
import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { YieldSourceModel } from '$server/mongo/models/YieldSource';
import {
  YieldSourceType,
  type YieldSourceDocRaw,
} from '$shared/typings/YieldSource';
import { batchProcessYieldSources } from './yieldSourceProcessor';
import type { CaviarNinePoolWithVault } from '$shared/typings/CaviarNine';
import { YIELD_SOURCE_MAPPINGS, YieldSource } from '$lib/constants';

interface RawYieldSource {
  id: string;
  originalName: string;
  type: YieldSourceType;
  rawApy: string | number;
  rawTvl: string | number;
  rawData: YieldSourceDocRaw<CaviarNinePoolWithVault>;
}

interface UpdateResult {
  updates: number;
  errors: number;
  updatedIds: string[];
}

export async function updateYieldSourcesBatch(
  rawYieldSources: RawYieldSource[],
  sourceName: YieldSource
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
    yieldSourceName: sourceName,
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
            dappIcon: YIELD_SOURCE_MAPPINGS[sourceName].fallbackIcon,
            dappName: YIELD_SOURCE_MAPPINGS[sourceName].name,
            tokenIcons: processedResult.tokenIcons,

            type: source.type,
            currentApy: apy.toString(),
            tvl: tvl.toString(),
            lastUpdated: now,
            raw: source.rawData,
            yieldSubSources: source.rawData.yieldSubSources,
            isComposite: source.rawData.isComposite,
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
