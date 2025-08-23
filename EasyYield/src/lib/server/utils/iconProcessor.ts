import { getDappInfo, batchFetchTokenIcons } from './iconFetcher';
import { getFallbackTokenIcon } from '$shared/utils/dataTransform';
import { YIELD_SOURCE_MAPPINGS } from '$lib/constants';
import type { Protocols } from '$shared/typings/YieldSource';

interface IconData {
  dappIcon?: string;
  dappName?: string;
  tokenIcons: string[];
}

export async function processYieldSourceIcons(
  yieldSource: Protocols,
  resourceAddresses: string[],
  tokenSymbols: string[]
): Promise<IconData> {
  // Get protocol/dApp info
  const protocolMapping = YIELD_SOURCE_MAPPINGS[yieldSource];
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
    yieldSourceName: Protocols;
    resourceAddresses: string[];
    tokenSymbols: string[];
  }>
): Promise<Map<string, IconData>> {
  const results = new Map<string, IconData>();

  // Collect all unique resource addresses and dApp definitions
  const allResourceAddresses = new Set<string>();
  const dappDefinitions = new Set<string>();

  yieldSources.forEach(({ yieldSourceName, resourceAddresses }) => {
    resourceAddresses.forEach((addr) => allResourceAddresses.add(addr));
    const protocolMapping = YIELD_SOURCE_MAPPINGS[yieldSourceName];

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
    const { yieldSourceName, resourceAddresses, tokenSymbols } =
      yieldSources[i];
    const iconData = await processYieldSourceIcons(
      yieldSourceName,
      resourceAddresses,
      tokenSymbols
    );
    results.set(i.toString(), iconData);
  }

  return results;
}
