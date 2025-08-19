import { RadixGatewayClient } from '$server/services/gatewayClient';
import { generateFallbackName } from '$shared/utils/dataTransform';
import type { BatchProcessor } from './batchProcessor';

export const resourceMetadataBatchProcessor: BatchProcessor<string, string> = {
  batchSize: 20,

  async processBatch(
    resourceAddresses: string[]
  ): Promise<Map<string, string>> {
    const gatewayApi = RadixGatewayClient.getInstance();
    const results = new Map<string, string>();

    //  Use the correct method name
    const response =
      await gatewayApi.state.getEntityDetailsVaultAggregated(resourceAddresses);

    response.forEach((entityDetails, index) => {
      const resourceAddress = resourceAddresses[index];

      if (entityDetails && entityDetails.details?.type === 'FungibleResource') {
        const metadata = entityDetails.metadata?.items || [];

        const symbol = metadata.find((item) => item.key === 'symbol')?.value
          ?.typed?.value;
        const name = metadata.find((item) => item.key === 'name')?.value?.typed
          ?.value;

        const displayName =
          symbol || name || generateFallbackName(resourceAddress);
        results.set(resourceAddress, displayName);
      } else {
        results.set(resourceAddress, generateFallbackName(resourceAddress));
      }
    });

    return results;
  },
};
