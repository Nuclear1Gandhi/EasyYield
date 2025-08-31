import type { RadixDappToolkit } from '@radixdlt/radix-dapp-toolkit';

export async function addLiquidity(opts: {
  toolkit: RadixDappToolkit;
  accountAddress: string;
  poolAddress: string;
  token1Address: string;
  token2Address: string;
  token1Amount: string;
  token2Amount: string;
}) {
  const {
    toolkit,
    accountAddress,
    poolAddress,
    token1Address,
    token2Address,
    token1Amount,
    token2Amount,
  } = opts;
  const manifest = `
    CALL_METHOD
      Address("${accountAddress}")
      "withdraw"
      Address("${token1Address}")
      Decimal("${token1Amount}");
    CALL_METHOD
      Address("${accountAddress}")
      "withdraw"
      Address("${token2Address}")
      Decimal("${token2Amount}");
    TAKE_FROM_WORKTOP
      Address("${token1Address}")
      Decimal("${token1Amount}")
      Bucket("token1_bucket");
    TAKE_FROM_WORKTOP
      Address("${token2Address}")
      Decimal("${token2Amount}")
      Bucket("token2_bucket");
    CALL_METHOD
      Address("${poolAddress}")
      "add_liquidity"
      Bucket("token1_bucket")
      Bucket("token2_bucket");
    CALL_METHOD
      Address("${accountAddress}")
      "deposit_batch"
      Expression("ENTIRE_WORKTOP");
  `;
  const result = await toolkit.walletApi.sendTransaction({
    transactionManifest: manifest,
    version: 1,
  });

  return result.isOk()
    ? { success: true, transactionId: result.value.transactionIntentHash }
    : { success: false, error: 'Transaction failed' };
}
