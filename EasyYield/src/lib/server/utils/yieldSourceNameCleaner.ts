// src/server/utils/yieldSourceNameCleaner.ts
import { resourceCache } from '$server/cache/resourceCache';
import { YieldSourceType } from '$shared/typings/YieldSource';
import {
  extractResourceAddresses,
  generateFallbackName,
} from '$shared/utils/dataTransform';
import { processBatches } from './batchProcessor';
import { resourceMetadataBatchProcessor } from './gatewayBatchProcessor';

interface ResourceInfo {
  address: string;
  name?: string;
  symbol?: string;
}

// ✅ EXTRACTED: Common name cleaning logic
function applyNameCleaning(cleanName: string): string {
  return cleanName
    .replace(/\s*[\/\-_|:,]{2,}\s*/g, '/')
    .replace(/^\s*[\/\-_|:,]\s*/, '')
    .replace(/\s*[\/\-_|:,]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ✅ EXTRACTED: Type-specific display name and description logic
function getDisplayNameAndDescription(
  cleanName: string,
  yieldSourceType: YieldSourceType
): { displayName: string; description: string } {
  let displayName = cleanName;
  let description = '';

  switch (yieldSourceType) {
    case YieldSourceType.LSU_POOL:
      displayName = cleanName.replace(/caviarnine/gi, '').trim() || 'LSU Pool';
      description = 'Liquid Staking';
      break;

    case YieldSourceType.VALIDATOR:
      displayName = 'Validator Staking';
      description = 'Direct XRD Staking';
      break;

    case YieldSourceType.DEX_PAIR:
      displayName = cleanName.replace(/ociswap/gi, '').trim() || 'DEX Pool';
      description = 'DEX Liquidity Pool';
      break;

    default:
      description = 'DeFi Yield Source';
  }

  // Ensure displayName isn't empty
  if (!displayName || displayName.length < 2) {
    displayName = cleanName || 'Pool';
  }

  return { displayName, description };
}

// ✅ EXTRACTED: Core name replacement logic
function replaceResourceAddresses(
  originalName: string,
  resourceAddresses: string[],
  resourceNames: Map<string, string>,
  resourceInfos?: ResourceInfo[]
): string {
  let cleanName = originalName;

  resourceAddresses.forEach((address) => {
    const resourceInfo = resourceInfos?.find((r) => r.address === address);
    const displayName =
      resourceInfo?.symbol ||
      resourceInfo?.name ||
      resourceNames.get(address) ||
      generateFallbackName(address);
    cleanName = cleanName.replace(address, displayName);
  });

  return cleanName;
}

// ✅ CORE LOGIC: Common processing pipeline
function processYieldSourceNameCore(
  originalName: string,
  yieldSourceType: YieldSourceType,
  resourceNames: Map<string, string>,
  resourceInfos?: ResourceInfo[]
): { displayName: string; description: string } {
  // Extract resource addresses
  const resourceAddresses = extractResourceAddresses(originalName);

  // Replace resource addresses with friendly names
  let cleanName = replaceResourceAddresses(
    originalName,
    resourceAddresses,
    resourceNames,
    resourceInfos
  );

  // Apply common name cleaning
  cleanName = applyNameCleaning(cleanName);

  // Get type-specific display name and description
  return getDisplayNameAndDescription(cleanName, yieldSourceType);
}

// ✅ BATCHING UTILITIES
export async function batchFetchResourceNames(
  resourceAddresses: string[]
): Promise<Map<string, string>> {
  if (resourceAddresses.length === 0) return new Map();

  const results = new Map<string, string>();

  // Get cached results first
  const cachedResults = resourceCache.getMultiple(resourceAddresses);
  cachedResults.forEach((value, key) => results.set(key, value));

  // Filter uncached addresses
  const uncachedAddresses = resourceAddresses.filter(
    (addr) => !cachedResults.has(addr)
  );

  if (uncachedAddresses.length === 0) {
    return results;
  }

  // Use reusable batch processor
  const batchResults = await processBatches(
    uncachedAddresses,
    resourceMetadataBatchProcessor,
    {
      onBatchError: (error, batch) => {
        const fallbackResults = new Map<string, string>();
        batch.forEach((addr) => {
          const fallbackName = generateFallbackName(addr);
          fallbackResults.set(addr, fallbackName);
        });
        return fallbackResults;
      },
      onProgress: (processed, total) => {
        console.log(`Fetched resource metadata: ${processed}/${total}`);
      },
    }
  );

  // Cache all results
  batchResults.forEach((value, key) => {
    const ttl = value.startsWith('Resource')
      ? 60 * 60 * 1000 // 1 hour for fallbacks
      : 24 * 60 * 60 * 1000; // 24 hours for real data
    resourceCache.set(key, value, ttl);
    results.set(key, value);
  });

  return results;
}

function getCachedResourceNames(
  resourceAddresses: string[]
): Map<string, string> {
  const resourceNames = new Map<string, string>();
  resourceAddresses.forEach((address) => {
    const cachedName = resourceCache.get(address);
    if (cachedName) {
      resourceNames.set(address, cachedName);
    } else {
      // Use fallback if not in cache
      resourceNames.set(address, generateFallbackName(address));
    }
  });
  return resourceNames;
}

// ✅ PUBLIC API: Async version (fetches from API if needed)
export async function cleanYieldSourceName(
  originalName: string,
  yieldSourceType: YieldSourceType,
  resourceInfos?: ResourceInfo[]
): Promise<{ displayName: string; description: string }> {
  // Extract resource addresses
  const resourceAddresses = extractResourceAddresses(originalName);

  // Batch fetch all resource names
  const resourceNames = await batchFetchResourceNames(resourceAddresses);

  // Process using core logic
  return processYieldSourceNameCore(
    originalName,
    yieldSourceType,
    resourceNames,
    resourceInfos
  );
}

// ✅ PUBLIC API: Cache-only version (assumes pre-fetched)
export function cleanYieldSourceNameWithCache(
  originalName: string,
  yieldSourceType: YieldSourceType,
  resourceInfos?: ResourceInfo[]
): { displayName: string; description: string } {
  // Extract resource addresses
  const resourceAddresses = extractResourceAddresses(originalName);

  // Use cache-only (no API calls, assumes pre-fetched)
  const resourceNames = getCachedResourceNames(resourceAddresses);

  // Process using core logic
  return processYieldSourceNameCore(
    originalName,
    yieldSourceType,
    resourceNames,
    resourceInfos
  );
}

// ✅ CONVENIENCE FUNCTIONS
export async function generateResourceDisplayName(
  resourceAddress: string
): Promise<string> {
  const cached = resourceCache.get(resourceAddress);
  if (cached) return cached;

  const results = await batchFetchResourceNames([resourceAddress]);
  return results.get(resourceAddress) || generateFallbackName(resourceAddress);
}

export function getResourceDisplayNameSync(resourceAddress: string): string {
  return (
    resourceCache.get(resourceAddress) || generateFallbackName(resourceAddress)
  );
}

export async function processYieldSourceData(
  rawYieldSource: any,
  yieldSourceType: YieldSourceType
) {
  const { displayName, description } = await cleanYieldSourceName(
    rawYieldSource.name,
    yieldSourceType
  );

  return {
    ...rawYieldSource,
    name: rawYieldSource.name, // Keep original
    displayName,
    description,
  };
}

export function extractTokenSymbols(displayName: string): string[] {
  // Extract symbols from names like "XRD/USDC Pool" or "XRD-USDT"
  const pairMatch = displayName.match(/([A-Z]{2,10})[\/\-]([A-Z]{2,10})/);
  if (pairMatch) {
    return [pairMatch[1], pairMatch[2]];
  }
  // Single token like "XRD Pool"
  const singleMatch = displayName.match(/([A-Z]{2,10})/);
  if (singleMatch) {
    return [singleMatch[0]];
  }

  return [];
}
