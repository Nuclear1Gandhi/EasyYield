import type { RadixDappToolkit } from '@radixdlt/radix-dapp-toolkit';

export async function stakeXrd(opts: {
  toolkit: RadixDappToolkit;
  accountAddress: string;
  validatorAddress: string;
  amount: string;
}) {
  const { toolkit, accountAddress, validatorAddress, amount } = opts;
  const manifest = `
    CALL_METHOD
      Address("${accountAddress}")
      "withdraw"
      Address("resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd")
      Decimal("${amount}");
    TAKE_FROM_WORKTOP
      Address("resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd")
      Decimal("${amount}")
      Bucket("xrd_bucket");
    CALL_METHOD
      Address("${validatorAddress}")
      "stake"
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
