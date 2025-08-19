import {
  GatewayApiClient,
  RadixNetwork,
} from '@radixdlt/babylon-gateway-api-sdk';

class RadixGatewayClient {
  private static instance: GatewayApiClient | null = null;

  static getInstance(): GatewayApiClient {
    if (!this.instance) {
      this.instance = GatewayApiClient.initialize({
        networkId: parseInt(
          process.env.RADIX_NETWORK_ID ?? RadixNetwork.Mainnet.toString()
        ),
        applicationName: 'EasyYield',
        applicationVersion: '1.0.0',
      });
    }
    return this.instance;
  }
}

export { RadixGatewayClient };
