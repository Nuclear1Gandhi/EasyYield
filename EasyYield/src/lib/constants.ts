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
  [YieldSource.CaviarNine]: {
    name: 'CaviarNine',
    dappDefinitionAddress:
      'account_rdx12yrjl8m5a4cn9aap2ez2lmvw6g64zgyqnlj4gvugzstye4gnj6assc', // CaviarNine dApp definition
    fallbackIcon:
      'https://assets.caviarnine.com/icons/caviarnine_logo_light_400.png',
  },
  [YieldSource.Ociswap]: {
    name: 'Ociswap',
    dappDefinitionAddress:
      'account_rdx12x2ecj3kp4mhq9u34xrdh7njzyz0ewcz4szv0jw5jksxxssnjh7z6z' as string, // Ociswap dApp definition
    fallbackIcon: 'https://ociswap.com/icons/oci.png',
  },
  [YieldSource.Xrd]: {
    name: 'Radix',
    dappDefinitionAddress: undefined, // Native staking
    fallbackIcon: '/no-image-circle-min.png',
  },
} as const;
