import { resourceCache } from '$server/cache/resourceCache';
import { RadixGatewayClient } from '$server/services/gatewayClient';

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
