import type { RadixDappToolkit } from '@radixdlt/radix-dapp-toolkit';

export async function mintLsu(opts: {
  toolkit: RadixDappToolkit;
  accountAddress: string;
  poolAddress: string;
  xrdAmount: string;
}) {
  const { toolkit, accountAddress, poolAddress, xrdAmount } = opts;
  const manifest = `
    CALL_METHOD
      Address("${accountAddress}")
      "withdraw"
      Address("resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd")
      Decimal("${xrdAmount}");
    TAKE_FROM_WORKTOP
      Address("resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd")
      Decimal("${xrdAmount}")
      Bucket("xrd_bucket");
    CALL_METHOD
      Address("${poolAddress}")
      "mint_lsu"
      Bucket("xrd_bucket");
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
