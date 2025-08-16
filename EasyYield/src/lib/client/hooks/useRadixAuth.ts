import { writable } from 'svelte/store';
import {
  RadixDappToolkit,
  RadixNetwork,
  DataRequestBuilder,
} from '@radixdlt/radix-dapp-toolkit';
import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';
import { loginWithJwt } from '$client/api/auth/auth';

const dAppDefinitionAddress =
  'component_rdx1qdevdappdefinition0123456789abcdef';

export function useRadixAuth() {
  const walletData = writable<any>(null);
  const rdt = RadixDappToolkit({
    networkId: RadixNetwork.Mainnet,
    applicationVersion: '1.0.0',
    applicationName: 'EasyYield',
    applicationDappDefinitionAddress: dAppDefinitionAddress,
  });

  const gatewayApi = GatewayApiClient.initialize(rdt.gatewayApi.clientConfig);

  // Request at least one account
  rdt.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1));

  // Subscribe to wallet connect
  rdt.walletApi.walletData$.subscribe(async (data) => {
    walletData.set(data);

    // Just always call backend to set cookie when a new wallet is connected (idempotent)
    if (data?.accounts?.length) {
      const address = data.accounts[0].address;
      await loginWithJwt(address);
      console.info('Logged in with address:', address);
    }
  });

  function logout() {
    // Optionally: call a backend /api/auth/logout that clears the cookie
    // And clear frontend stores if you store anything client-side
    walletData.set(null);
  }

  return { walletData, logout, rdt, gatewayApi };
}
