import { HistoricalYieldModel } from '$server/mongo/models/HistoricalYieldDoc';
import { YieldSourceModel } from '$server/mongo/models/YieldSource';
import type { PoolInfoFungibleResource } from '$shared/typings/CaviarNine';
import {
  Dapps,
  YieldSourceType,
  type YieldSubSource,
} from '$shared/typings/YieldSource';

export type RawYieldSource = {
  address: string;
  name: string;
  tokens: PoolInfoFungibleResource;
  tvl: string;
  apy: string;
  volume24h: string;
  type: YieldSourceType;

  status: undefined;

  dapp: Dapps;
  dappIcon: string;

  features: string[];

  yieldSubSources: YieldSubSource[];

  raw: any;
};

interface UpdateResult {
  updates: number;
  errors: number;
  updatedAddresses: string[];
}

export async function updateYieldSourcesBatch<P extends Dapps>(
  rawYieldSources: RawYieldSource[],
  sourceName: P
): Promise<UpdateResult> {
  if (rawYieldSources.length === 0) {
    console.log(`[INFO] No ${sourceName} yield sources to process`);
    return { updates: 0, errors: 0, updatedAddresses: [] };
  }

  console.log(
    `[INFO] Updating ${rawYieldSources.length} ${sourceName} yield sources...`
  );

  let updates = 0;
  let errors = 0;
  const updatedAddresses: string[] = [];
  const now = new Date();

  for (const source of rawYieldSources) {
    try {
      // ✅ Get protocol info from mappings
      await YieldSourceModel.findOneAndUpdate(
        { yieldSourceAddress: source.address },
        {
          $set: {
            name: source.name,
            description: getDescriptionByType(source.type),
            tokens: source.tokens,

            // Protocol info from mappings
            dapp: source.dapp,
            dappIcon: source.dappIcon,
            volume24h: source.volume24h,
            type: source.type,
            apy: source.apy,
            tvl: source.tvl,
            lastUpdated: now,
            raw: source.raw,
            yieldSubSources: source.yieldSubSources,
            isComposite: source.yieldSubSources.length > 1,
            features: source.features,
            // protocolMetadata: source.rawData.protocolMetadata,
          },
        },
        { upsert: true, new: true }
      );

      // ✅ Historical yield tracking
      await HistoricalYieldModel.create({
        yieldSourceAddress: source.address,
        apy: source.apy,
        tvl: source.tvl,
        timestamp: now,
      });

      updatedAddresses.push(source.address);
      updates++;
    } catch (err) {
      errors++;
      console.error(
        `[FAIL] Could not update ${sourceName} source ${source.address}:`,
        err
      );
    }
  }

  console.log(`[SUCCESS] ${sourceName}: ${updates} updated, ${errors} errors`);
  return { updates, errors, updatedAddresses };
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
