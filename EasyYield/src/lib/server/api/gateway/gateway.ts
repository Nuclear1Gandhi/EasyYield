import { resourceCache } from '$server/cache/resourceCache';
import { RadixGatewayClient } from '$server/api/gateway/gatewayClient';
import type { TokenMetadata } from '$server/services/tokenCache';

export async function resolveTokenNames(
  address: string
): Promise<{ name: string; symbol: string }> {
  const gateway = RadixGatewayClient.getInstance();
  let nameAndSymbol = { name: 'unknown', symbol: '--' };

  await resourceCache.resolve(address, async () => {
    console.log(`🔍 Fetching token details for: ${address.slice(0, 20)}...`);
    // Correct method signature: single address as string, not array
    const response = await gateway.state.getEntityDetailsVaultAggregated(
      [address],
      {
        explicitMetadata: ['symbol', 'name'], // Request symbol and name metadata
        nonFungibleIncludeNfids: false,
        nativeResourceDetails: true,
      }
    );
    // The response is a single item, not an array
    const metadata = response[0].explicit_metadata?.items || [];
    const symbolItem = metadata.find((item) => item.key === 'symbol');
    const nameItem = metadata.find((item) => item.key === 'name');

    if (
      symbolItem?.value.programmatic_json.kind !== 'Enum' ||
      nameItem?.value.programmatic_json.kind !== 'Enum'
    ) {
      throw new Error(`Wrong kind of symbol item ${address}`);
    }

    const symbol = symbolItem?.value?.programmatic_json.fields[0];
    const name = nameItem?.value?.programmatic_json.fields[0];
    if (!symbol || !name) {
      throw new Error(`No symbol found for ${address}`);
    }

    if (symbol.kind !== 'String' || name.kind !== 'String') {
      throw new Error(`Incorrect symbol kind ${address}`);
    }

    console.log(
      `✅ Resolved ${address.slice(0, 20)}... → ${symbol.value} | ${name.value}`
    );
    nameAndSymbol.name = name.value;
    nameAndSymbol.symbol = symbol.value;

    return symbol.value;
  });

  return nameAndSymbol;
}

export async function fetchTokenMetadataSingle(address: string): Promise<TokenMetadata | null> {
  try {
    const gateway = RadixGatewayClient.getInstance();
    const entity = await gateway.state.getEntityDetailsVaultAggregated(address, {
      explicitMetadata: ['name', 'symbol', 'icon_url'],
    });

    const metadata = entity?.metadata?.items ?? [];
    const metaMap = new Map<string, string>();
    for (const m of metadata) {
      const key = m?.key;
      const val = m?.value?.typed?.value;
      if (key && typeof val === 'string') metaMap.set(key, val);
    }

    const details = entity?.details;
    let decimals = 18;
    if (details?.type === 'FungibleResource' && typeof details.divisibility === 'number') {
      decimals = details.divisibility;
    }

    return {
      address: address.toLowerCase(),
      symbol: metaMap.get('symbol') || address,
      name: metaMap.get('name') || `Token ${address}`,
      iconUrl: metaMap.get('icon_url'),
      decimals,
    };
  } catch {
    return null;
  }
}

export async function fetchTokenMetadataMany(addresses: string[]): Promise<Record<string, TokenMetadata | null>> {
  // Simple concurrent fan-out with modest parallelism to respect rate limits
  const out: Record<string, TokenMetadata | null> = {};
  const batch = 8;
  for (let i = 0; i < addresses.length; i += batch) {
    const chunk = addresses.slice(i, i + batch);
    const results = await Promise.all(chunk.map(a => fetchTokenMetadataSingle(a)));
    results.forEach((meta, idx) => {
      const key = chunk[idx].toLowerCase();
      out[key] = meta;
    });
  }
  return out;
}
