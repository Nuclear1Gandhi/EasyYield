import { Dapps, type YieldSourceDocRaw } from '$shared/typings/YieldSource';

export function getPoolTier(yieldSource: YieldSourceDocRaw): string {
  switch (yieldSource.dapp) {
    case Dapps.CAVIARNINE:
      return yieldSource.dappMetadata.poolType === 'LSU_POOL'
        ? 'Premium'
        : 'Standard';
    case Dapps.OCISWAP:
      return yieldSource.dappMetadata.version === 'pro'
        ? 'Professional'
        : 'Basic';
    case Dapps.RADIX_STAKING:
      return yieldSource.dappMetadata.category; // 'institutional', 'community', etc.
    default:
      return 'Standard';
  }
}
