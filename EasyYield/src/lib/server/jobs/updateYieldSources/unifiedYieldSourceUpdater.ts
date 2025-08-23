import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { YieldSourceModel } from '$server/mongo/models/YieldSource';
import {
  Protocols,
  YieldSourceType,
  type YieldSourceDocRaw,
} from '$shared/typings/YieldSource';
import { batchProcessYieldSources } from './yieldSourceProcessor';
import { YIELD_SOURCE_MAPPINGS } from '$lib/constants';

interface RawYieldSource<P extends Protocols> {
  id: string;
  originalName: string;
  type: YieldSourceType;
  rawApy: string | number;
  rawTvl: string | number;
  rawData: YieldSourceDocRaw<P, any>;
}

interface UpdateResult {
  updates: number;
  errors: number;
  updatedIds: string[];
}

export async function updateYieldSourcesBatch<P extends Protocols>(
  rawYieldSources: RawYieldSource<P>[],
  sourceName: P
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
    const data = processedData.get(source.id);
    try {
      await YieldSourceModel.findOneAndUpdate(
        { yieldSourceId: source.id },
        {
          $set: {
            name: source.originalName,
            displayName: data?.displayName,
            description: data?.description,
            tokenSymbols: data?.tokenSymbols,

            // Updated field names
            protocolIcon: YIELD_SOURCE_MAPPINGS[sourceName].fallbackIcon,
            protocolName: YIELD_SOURCE_MAPPINGS[sourceName].name,
            tokenIcons: data?.tokenIcons,

            type: source.type,
            currentApy: source.rawData.currentApy.toString(),
            tvl: source.rawTvl.toString(),
            lastUpdated: now,
            raw: source.rawData.raw,
            yieldSubSources: source.rawData.yieldSubSources,
            isComposite: source.rawData.isComposite,
            features: source.rawData.features,
            protocolMetadata: source.rawData.protocolMetadata,
          },
        },
        { upsert: true, new: true }
      );

      // ✅ Unified historical yield tracking
      await HistoricalYieldModel.create({
        yieldSourceId: source.id,
        apy: source.rawData.currentApy.toString(),
        tvl: source.rawTvl,
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
