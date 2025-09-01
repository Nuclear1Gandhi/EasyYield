import type { BaseExtractedPoolInfo } from '$shared/typings/CaviarNine';
import type { StateEntityDetailsVaultResponseItem } from '@radixdlt/babylon-gateway-api-sdk';

export function extractPoolInfo(
  pool: StateEntityDetailsVaultResponseItem
): BaseExtractedPoolInfo {
  // Extract core identifiers
  const address = pool.address;

  // Extract fungible resource addresses and amounts
  const fungibleResources = pool.fungible_resources.items.map((fr) => {
    const resourceAddress = fr.resource_address;
    const vault = fr.vaults.items[0];
    const amount = vault ? vault.amount : '0';
    const vaultAddress = vault ? vault.vault_address : null;
    return { resourceAddress, amount, vaultAddress };
  });

  // Extract metadata fields as key-value pairs
  const metadata: any = {};
  pool.metadata.items.forEach((item) => {
    let value = null;
    if (item.value.typed) {
      if (item.value.typed.type === 'String') {
        value = item.value.typed.value;
      } else if (item.value.typed.type === 'StringArray') {
        value = item.value.typed.values;
      } else if (item.value.typed.type === 'GlobalAddress') {
        value = item.value.typed.value;
      }
    }
    metadata[item.key] = value;
  });

  // Extract key state fields from the details object
  const stateFields: { [key: string]: any } = {};
  if (
    pool.details &&
    pool.details.type === 'Component' &&
    pool.details.state &&
    //@ts-expect-error
    pool.details.state.fields
  ) {
    //@ts-expect-error
    pool.details.state.fields.forEach((field: any) => {
      stateFields[field.field_name] = field.value;
    });
  }

  // Extract roles overview
  const roles = {
    //@ts-expect-error
    owner: pool.details?.role_assignments?.owner || null,
    //@ts-expect-error
    entries: pool.details?.role_assignments?.entries || [],
  };

  return {
    address,
    fungibleResources,
    metadata,
    state: stateFields,
    roles,
  };
}
