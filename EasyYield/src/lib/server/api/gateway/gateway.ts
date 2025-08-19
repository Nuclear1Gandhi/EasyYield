import type { YieldSourceDoc } from '$shared/typings/YieldSource';
import {
  GatewayApiClient,
  RadixNetwork,
} from '@radixdlt/babylon-gateway-api-sdk';

// 1. Initialize gateway client for backend (Stokenet or Mainnet)
export const gatewayApi = GatewayApiClient.initialize({
  networkId: RadixNetwork.Mainnet,
  applicationName: 'EasyYield',
  applicationVersion: '1.0.0',
});

// 2. Fetch yield sources details (by component address)
export async function fetchYieldSourceDetails(componentAddress: string) {
  try {
    const result = await gatewayApi.state.getEntityMetadata(componentAddress);
    return result;
  } catch (err) {
    console.error('Error fetching yield source details', err);
    throw err;
  }
}

async function fetchValidatorStakes(): Promise<YieldSourceDoc[]> {
  const validators = await gatewayApi.state.getValidators();

  return validators.items.map((v) => ({
    yieldSourceId: `validator-${v.address}`,
    type: 'VALIDATOR',
    currentApy: v.apy * 100, // convert to percent
    tvl: v.totalStake / 1e18, // convert from base units
    lastUpdated: new Date(),
  }));
}
