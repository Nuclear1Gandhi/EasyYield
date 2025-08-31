import { batchProcessIcons } from '$server/utils/iconProcessor';
import {
  batchFetchResourceNames,
  cleanYieldSourceNameWithCache,
  extractTokenSymbols,
} from '$server/utils/yieldSourceNameCleaner';
import type { Dapps, YieldSourceType } from '$shared/typings/YieldSource';
import { extractResourceAddresses } from '$shared/utils/dataTransform';

interface YieldSourceProcessingResult {
  displayName: string;
  description: string;
  tokenSymbols: string[];
  dappIcon?: string;
  dappName?: string;
  tokenIcons: string[];
}

export async function batchProcessYieldSources(
  yieldSources: Array<{
    id: string;
    originalName: string;
    yieldSourceType: YieldSourceType;
    yieldSourceName: Dapps;
  }>
): Promise<Map<string, YieldSourceProcessingResult>> {
  // Step 1: Pre-fetch resource names
  const allResourceAddresses = new Set<string>();
  const resourceMap = new Map<string, string[]>();

  yieldSources.forEach(({ id, originalName }) => {
    const addresses = extractResourceAddresses(originalName);
    resourceMap.set(id, addresses);
    addresses.forEach((addr) => allResourceAddresses.add(addr));
  });

  await batchFetchResourceNames(Array.from(allResourceAddresses));

  // Step 2: Process names
  const nameResults = new Map<
    string,
    { displayName: string; description: string; tokenSymbols: string[] }
  >();
  yieldSources.forEach(({ id, originalName, yieldSourceType }) => {
    const { displayName, description } = cleanYieldSourceNameWithCache(
      originalName,
      yieldSourceType
    );
    const tokenSymbols = extractTokenSymbols(displayName);
    nameResults.set(id, { displayName, description, tokenSymbols });
  });

  // Step 3: Process icons
  const iconProcessingData = yieldSources.map(
    ({ yieldSourceType, yieldSourceName }, index) => ({
      yieldSourceName,
      yieldSourceType,
      resourceAddresses: resourceMap.get(yieldSources[index].id) || [],
      tokenSymbols: nameResults.get(yieldSources[index].id)?.tokenSymbols || [],
    })
  );

  const iconResults = await batchProcessIcons(iconProcessingData);
  // Step 4: Combine results
  const finalResults = new Map<string, YieldSourceProcessingResult>();
  yieldSources.forEach(({ id }, index) => {
    const nameData = nameResults.get(id)!;
    const iconData = iconResults.get(index.toString())!;

    finalResults.set(id, {
      ...nameData,
      ...iconData,
    });
  });
  return finalResults;
}
