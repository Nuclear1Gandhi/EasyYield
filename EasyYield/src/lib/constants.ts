import { Protocols } from '$shared/typings/YieldSource';

export const componentAddress =
  'component_tdx_2_1cz44jlxyv0wtu2cj7vrul0eh8jpcfv3ce6ptsnat5guwrdlhfpyydn';

// You can create a dApp definition in the dev console at https://stokenet-console.radixdlt.com/dapp-metadata
// then use that account for your dAppDefinitionAddress
export const dAppDefinitionAddress =
  'account_rdx129l2jufvgzk7drj00dy3gr4j2dra9sj9xyhhqhjktzu2k2rh0jr0at';

export const CAVIARNINE_HYPERSTAKE_ADDRESS =
  'component_rdx1cpz0zcyyl2fvtc5wdvfjjl3w0mjcydm4fefymudladklf6rn5gdwtf';
export const LSULP_RESOURCE =
  'resource_rdx1thksg5ng70g9mmy9ne7wz0sc7auzrrwy7fmgcxzel2gvp8pj0xxfmf';
export const XRD_RESOURCE =
  'resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd';
export const HYPERSTAKE_LP_RESOURCE =
  'resource_rdx1th0f0khh9g8hwa0qtxsarmq8y7yeekjnh4n74494d5zf4k5vw8qv6m';
export const CAVIARNINE_LSU_POOL_ADDRESS =
  'component_rdx1cppy08xgra5tv5melsjtj79c0ngvrlmzl8hhs7vwtzknp9xxs63mfp';

export const YIELD_SOURCE_MAPPINGS = {
  [Protocols.CAVIARNINE]: {
    name: 'CaviarNine',
    dappDefinitionAddress:
      'account_rdx12yrjl8m5a4cn9aap2ez2lmvw6g64zgyqnlj4gvugzstye4gnj6assc', // CaviarNine dApp definition
    fallbackIcon:
      'https://assets.caviarnine.com/icons/caviarnine_logo_light_400.png',
  },
  [Protocols.OCISWAP]: {
    name: 'Ociswap',
    dappDefinitionAddress:
      'account_rdx12x2ecj3kp4mhq9u34xrdh7njzyz0ewcz4szv0jw5jksxxssnjh7z6z' as string, // Ociswap dApp definition
    fallbackIcon: 'https://ociswap.com/icons/oci.png',
  },
  [Protocols.RADIX_STAKING]: {
    name: 'Radix',
    dappDefinitionAddress: undefined, // Native staking
    fallbackIcon: '/no-image-circle-min.png',
  },
} as const;
