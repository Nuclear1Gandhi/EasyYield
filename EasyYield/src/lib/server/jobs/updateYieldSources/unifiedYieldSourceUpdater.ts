import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { YieldSourceModel } from '$server/mongo/models/YieldSource';
import {
  Dapps,
  YieldSourceType,
  type YieldSourceDocRaw,
} from '$shared/typings/YieldSource';
import { YIELD_SOURCE_MAPPINGS } from '$lib/constants';

interface RawYieldSource<P extends Dapps> {
  id: string;
  originalName: string;
  rawData: YieldSourceDocRaw<P, any>;
}

interface UpdateResult {
  updates: number;
  errors: number;
  updatedIds: string[];
}

// ✅ SIMPLIFIED: Extract data directly from rawData.metadata
function extractTokenDataFromMetadata(metadata: any) {
  if (!metadata?.tokens) {
    return {
      tokenSymbols: [],
      tokenIcons: [],
    };
  }

  const tokens = Object.values(metadata.tokens) as Array<{
    symbol: string;
    iconUrl: string;
  }>;

  return {
    tokenSymbols: tokens.map(token => token.symbol),
    tokenIcons: tokens.map(token => token.iconUrl),
  };
}

export async function updateYieldSourcesBatch<P extends Dapps>(
  rawYieldSources: RawYieldSource<P>[],
  sourceName: P
): Promise<UpdateResult> {
  if (rawYieldSources.length === 0) {
    console.log(`[INFO] No ${sourceName} yield sources to process`);
    return { updates: 0, errors: 0, updatedIds: [] };
  }

  console.log(`[INFO] Updating ${rawYieldSources.length} ${sourceName} yield sources...`);
  
  let updates = 0;
  let errors = 0;
  const updatedIds: string[] = [];
  const now = new Date();

  for (const source of rawYieldSources) {
    try {
      // ✅ Extract token data directly from existing metadata
      const { tokenSymbols, tokenIcons } = extractTokenDataFromMetadata(
        source.rawData.metadata
      );
      console.log(source.rawData)
      // ✅ Get protocol info from mappings
      const protocolMapping = YIELD_SOURCE_MAPPINGS[sourceName];
      await YieldSourceModel.findOneAndUpdate(
        { yieldSourceId: source.id },
        {
          $set: {
            name: source.originalName,
            displayName: source.originalName,
            description: getDescriptionByType(source.rawData.type),
            tokenSymbols,
            tokenIcons,
            
            // Protocol info from mappings
            protocolIcon: protocolMapping.fallbackIcon,
            protocolName: protocolMapping.name,

            type: source.rawData.type,
            currentApy: source.rawData.currentApy.toString(),
            tvl: source.rawData.tvl.toString(),
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

      // ✅ Historical yield tracking
      await HistoricalYieldModel.create({
        yieldSourceId: source.id,
        apy: source.rawData.currentApy.toString(),
        tvl: source.rawData.tvl,
        timestamp: now,
      });

      updatedIds.push(source.id);
      updates++;
    } catch (err) {
      errors++;
      console.error(`[FAIL] Could not update ${sourceName} source ${source.id}:`, err);
    }
  }

  console.log(`[SUCCESS] ${sourceName}: ${updates} updated, ${errors} errors`);
  return { updates, errors, updatedIds };
}

// ✅ Simple helper for type-based descriptions
function getDescriptionByType(type: YieldSourceType): string {
  switch (type) {
    case YieldSourceType.SHAPE_LIQUIDITY:
    case YieldSourceType.INSTANT_UNSTAKE:
    case YieldSourceType.LSU_POOL:
      return 'Liquid Staking';
    case YieldSourceType.VALIDATOR:
      return 'Direct XRD Staking';
    case YieldSourceType.DEX_PAIR:
      return 'DEX Liquidity Pool';
    default:
      return 'DeFi Yield Source';
  }
}