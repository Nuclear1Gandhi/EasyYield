import { writable } from 'svelte/store';
import {
  RadixDappToolkit,
  RadixNetwork,
  DataRequestBuilder,
} from '@radixdlt/radix-dapp-toolkit';
import { GatewayApiClient } from '@radixdlt/babylon-gateway-api-sdk';
import { loginWithJwt } from '$client/api/auth/auth';
import { decodeJwt, getExistingJwt } from '$client/utils/jwt';
import { dAppDefinitionAddress } from '$lib/constants';
import { rdt } from '$lib/stores';

export function useRadixAuth() {
  const walletData = writable<any>(null);
  const toolkit = RadixDappToolkit({
    networkId: RadixNetwork.Mainnet,
    applicationVersion: '1.0.0',
    applicationName: 'EasyYield',
    applicationDappDefinitionAddress: dAppDefinitionAddress,
  });
  rdt.set(toolkit);

  const gatewayApi = GatewayApiClient.initialize(
    toolkit.gatewayApi.clientConfig
  );

  // Request at least one account
  toolkit.walletApi.setRequestData(DataRequestBuilder.accounts().atLeast(1));

  // Subscribe to wallet connect
  toolkit.walletApi.walletData$.subscribe(async (data) => {
    walletData.set(data);

    if (data?.accounts?.length) {
      const address = data.accounts[0].address;

      // Guard with sessionStorage (always available)
      const lastAddr = sessionStorage.getItem('wallet-addr');
      if (lastAddr === address) {
        return; // already logged in for this address
      }

      // Guard with JWT match if the JWT cookie is readable
      const jwt = getExistingJwt();
      if (jwt) {
        const decoded = decodeJwt(jwt);
        if (decoded?.sub === address) {
          // Already logged in with this address
          sessionStorage.setItem('wallet-addr', address);
          return;
        }
      }

      // Otherwise, log in and update session marker
      await loginWithJwt(address);
      sessionStorage.setItem('wallet-addr', address);
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
