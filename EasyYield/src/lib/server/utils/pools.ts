import { Protocols, type YieldSourceDocRaw } from '$shared/typings/YieldSource';

export function getPoolTier(yieldSource: YieldSourceDocRaw): string {
  switch (yieldSource.dapp) {
    case Protocols.CAVIARNINE:
      return yieldSource.dappMetadata.poolType === 'LSU_POOL'
        ? 'Premium'
        : 'Standard';
    case Protocols.OCISWAP:
      return yieldSource.dappMetadata.version === 'pro'
        ? 'Professional'
        : 'Basic';
    case Protocols.RADIX_STAKING:
      return yieldSource.dappMetadata.category; // 'institutional', 'community', etc.
    default:
      return 'Standard';
  }
}
