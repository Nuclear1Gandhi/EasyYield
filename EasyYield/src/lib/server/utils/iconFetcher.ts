import { RadixGatewayClient } from '$server/services/gatewayClient';

interface DappInfo {
  name?: string;
  iconUrl?: string;
}

interface TokenInfo {
  symbol?: string;
  iconUrl?: string;
}

// Cache for dApp definitions
const dappCache = new Map<string, DappInfo>();
const tokenIconCache = new Map<string, string>();

export async function getDappInfo(
  dappDefinitionAddress?: string
): Promise<DappInfo> {
  if (!dappDefinitionAddress) return {};

  const cached = dappCache.get(dappDefinitionAddress);
  if (cached) return cached;

  try {
    const gatewayApi = RadixGatewayClient.getInstance();

    const response = await gatewayApi.state.getEntityDetailsVaultAggregated(
      dappDefinitionAddress,
      {
        explicitMetadata: ['name', 'icon_url', 'dapp_definition'],
      }
    );

    const metadata =
      response.explicit_metadata?.items || response.metadata?.items || [];

    const name = metadata.find((item) => item.key === 'name')?.value?.typed
      ?.value;
    const iconUrl = metadata.find((item) => item.key === 'icon_url')?.value
      ?.typed?.value;

    const dappInfo = { name, iconUrl };
    dappCache.set(dappDefinitionAddress, dappInfo);
    return dappInfo;
  } catch (error) {
    console.warn(
      `Failed to fetch dApp info for ${dappDefinitionAddress}:`,
      error
    );
    const fallback = {};
    dappCache.set(dappDefinitionAddress, fallback);
    return fallback;
  }
}

export async function getTokenIconUrl(
  resourceAddress: string
): Promise<string | undefined> {
  const cached = tokenIconCache.get(resourceAddress);
  if (cached) return cached;

  try {
    const gatewayApi = RadixGatewayClient.getInstance();

    const response = await gatewayApi.state.getEntityDetailsVaultAggregated(
      resourceAddress,
      {
        explicitMetadata: ['icon_url'],
      }
    );

    const metadata =
      response.explicit_metadata?.items || response.metadata?.items || [];
    const iconUrl = metadata.find((item) => item.key === 'icon_url')?.value
      ?.typed?.value;

    tokenIconCache.set(resourceAddress, iconUrl || '');
    return iconUrl;
  } catch (error) {
    console.warn(`Failed to fetch token icon for ${resourceAddress}:`, error);
    tokenIconCache.set(resourceAddress, '');
    return undefined;
  }
}

// Batch fetch token icons
export async function batchFetchTokenIcons(
  resourceAddresses: string[]
): Promise<Map<string, string>> {
  const results = new Map<string, string>();

  // Get cached first
  resourceAddresses.forEach((addr) => {
    const cached = tokenIconCache.get(addr);
    if (cached) results.set(addr, cached);
  });

  // Fetch uncached
  const uncached = resourceAddresses.filter(
    (addr) => !tokenIconCache.has(addr)
  );

  if (uncached.length === 0) return results;

  try {
    const gatewayApi = RadixGatewayClient.getInstance();

    // Process in batches of 20
    for (let i = 0; i < uncached.length; i += 20) {
      const batch = uncached.slice(i, i + 20);

      try {
        const entities = await gatewayApi.state.getEntityDetailsVaultAggregated(
          batch,
          {
            explicitMetadata: ['icon_url'],
          }
        );

        entities.forEach((entity, index) => {
          const resourceAddress = batch[index];
          const metadata =
            entity.explicit_metadata?.items || entity.metadata?.items || [];
          const iconUrl =
            metadata.find((item) => item.key === 'icon_url')?.value?.typed
              ?.value || '';

          tokenIconCache.set(resourceAddress, iconUrl);
          results.set(resourceAddress, iconUrl);
        });
      } catch (batchError) {
        console.warn(`Failed to fetch token icons for batch:`, batchError);
        batch.forEach((addr) => {
          tokenIconCache.set(addr, '');
          results.set(addr, '');
        });
      }
    }
  } catch (error) {
    console.warn('Failed to batch fetch token icons:', error);
  }

  return results;
}
