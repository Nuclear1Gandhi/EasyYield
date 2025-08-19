import { YieldSourceType } from '$shared/typings/YieldSource';

export const componentAddress =
  'component_tdx_2_1cz44jlxyv0wtu2cj7vrul0eh8jpcfv3ce6ptsnat5guwrdlhfpyydn';

// You can create a dApp definition in the dev console at https://stokenet-console.radixdlt.com/dapp-metadata
// then use that account for your dAppDefinitionAddress
export const dAppDefinitionAddress =
  'account_rdx129l2jufvgzk7drj00dy3gr4j2dra9sj9xyhhqhjktzu2k2rh0jr0at';

export enum YieldSource {
  CaviarNine = 'Caviarnine',
  Xrd = 'Xrd',
  Ociswap = 'Ociswap',
}

export const YIELD_SOURCE_MAPPINGS = {
  [YieldSourceType.LSU_POOL]: {
    name: 'CaviarNine',
    dappDefinitionAddress: undefined, // CaviarNine dApp definition
    fallbackIcon: '/icons/protocols/caviarnine.svg',
  },
  [YieldSourceType.DEX_PAIR]: {
    name: 'Ociswap',
    dappDefinitionAddress:
      'account_tdx_2_1cxyqd5rt7ezwnxef3ja44qm5wu0gkm44x8y9p5x20setay2flatf2x' as string, // Ociswap dApp definition
    fallbackIcon: '/icons/protocols/ociswap.svg',
  },
  [YieldSourceType.VALIDATOR]: {
    name: 'Radix',
    dappDefinitionAddress: undefined, // Native staking
    fallbackIcon: '/icons/protocols/radix.svg',
  },
} as const;
