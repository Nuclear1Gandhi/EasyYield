// src/server/utils/iconProcessor.ts
import { getDappInfo, batchFetchTokenIcons } from './iconFetcher';
import type { YieldSourceType } from '$shared/typings/YieldSource';
import {
  getDappMapping,
  getFallbackTokenIcon,
} from '$shared/utils/dataTransform';

interface IconData {
  dappIcon?: string;
  dappName?: string;
  tokenIcons: string[];
}

export async function processYieldSourceIcons(
  yieldSourceType: YieldSourceType,
  resourceAddresses: string[],
  tokenSymbols: string[]
): Promise<IconData> {
  // Get protocol/dApp info
  const protocolMapping = getDappMapping(yieldSourceType);
  const dappInfo = await getDappInfo(protocolMapping.dappDefinitionAddress);

  // Get token icons from metadata
  const tokenIconUrls = await batchFetchTokenIcons(resourceAddresses);
  const tokenIcons = resourceAddresses.map((addr) => {
    const metadataIcon = tokenIconUrls.get(addr);
    if (metadataIcon) return metadataIcon;

    // Fallback based on symbol
    const matchingSymbol = tokenSymbols.find((symbol) =>
      addr.toLowerCase().includes(symbol.toLowerCase())
    );
    return matchingSymbol
      ? getFallbackTokenIcon(matchingSymbol)
      : '/no-image-circle-min.png';
  });

  return {
    dappIcon: dappInfo.iconUrl || protocolMapping.fallbackIcon,
    dappName: dappInfo.name || protocolMapping.name,
    tokenIcons: tokenIcons.filter(Boolean),
  };
}

// Batch process icons for multiple yield sources
export async function batchProcessIcons(
  yieldSources: Array<{
    yieldSourceType: YieldSourceType;
    resourceAddresses: string[];
    tokenSymbols: string[];
  }>
): Promise<Map<string, IconData>> {
  const results = new Map<string, IconData>();

  // Collect all unique resource addresses and dApp definitions
  const allResourceAddresses = new Set<string>();
  const dappDefinitions = new Set<string>();

  yieldSources.forEach(({ yieldSourceType, resourceAddresses }) => {
    resourceAddresses.forEach((addr) => allResourceAddresses.add(addr));

    const protocolMapping = getDappMapping(yieldSourceType);
    if (protocolMapping.dappDefinitionAddress) {
      dappDefinitions.add(protocolMapping.dappDefinitionAddress);
    }
  });

  // Batch fetch all icons and dApp info
  await Promise.all([
    batchFetchTokenIcons(Array.from(allResourceAddresses)),
    ...Array.from(dappDefinitions).map((addr) => getDappInfo(addr)),
  ]);

  // Process each yield source (now using cached data)
  for (let i = 0; i < yieldSources.length; i++) {
    const { yieldSourceType, resourceAddresses, tokenSymbols } =
      yieldSources[i];
    const iconData = await processYieldSourceIcons(
      yieldSourceType,
      resourceAddresses,
      tokenSymbols
    );
    results.set(i.toString(), iconData);
  }

  return results;
}
