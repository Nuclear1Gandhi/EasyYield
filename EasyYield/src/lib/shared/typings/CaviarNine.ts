export interface CaviarNinePool {
  address: string;
  name: string;
  type: 'DEX' | 'LSU';
  apy?: string;
  apr?: string;
  tvl?: string;
  token0?: { symbol: string };
  token1?: { symbol: string };
}

export type CaviarNinePoolResponse = {
  // Based on CoinGecko-style API and fee vaults endpoint
  pools?: any[];
  data?: any[];
};

export type CaviarNineTicker = {
  ticker_id: string;
  base_currency: string;
  target_currency: string;
  pool_id: string;
  last_price: string;
  base_volume: string;
  target_volume: string;
  bid: string;
  ask: string;
  high: string;
  low: string;
};

export type CaviarNinePair = {
  ticker_id: string;
  base: string;
  target: string;
  pool_id: string;
};

// src/server/api/caviarNine/types.ts

/**
 * Represents a single fee vault entry returned by the CaviarNine fee_vaults endpoint.
 */
export type FeeVault = {
  component_address: string;
  /** Resource address of the vault token (Radix resource ID). */
  vault_resource_address: string;

  /** Human-readable name of the vault token. */
  vault_resource_name: string;

  /** Symbol of the vault token. */
  vault_resource_symbol: string;

  /** Price of one vault token denominated in XRD, as a decimal string. */
  vault_resource_price_to_xrd: string;

  /** Amount of vault tokens currently available, as a decimal string. */
  vault_amount_available: string;

  /** Total value of vault tokens available, expressed in XRD. */
  vault_value_xrd: number;

  /** Resource address of the “base” token for swaps, if any. */
  base_resource_address: string;

  /** Human-readable name of the base token. */
  base_resource_name: string;

  /** Symbol of the base token. */
  base_resource_symbol: string;

  /** Amount of base tokens required for a swap, as a decimal string. */
  base_amount_required: string;

  /** Value in XRD required for the base amount, as a number. */
  base_value_required_xrd: number;

  /** Profit and loss in XRD for this vault position (can be negative). */
  pnl_in_xrd: number;

  /** Indicates whether a swap operation is active for this vault. */
  swap: boolean;
};

/**
 * Augment the existing CaviarNinePool with optional feeVaultData.
 */
export interface CaviarNinePoolWithVault extends CaviarNinePool {
  feeVaultData?: FeeVault | null;
}
/**
 * The top-level response structure for fee_vaults:
 */
export interface FeeVaultsResponse {
  /** List of fee vault entries. */
  data: FeeVault[];
  total_sum_vault_value_xrd: 30802;
  total_sum_true_vault_value_xrd: 121;
}

// Example usage:
// const response: FeeVaultsResponse = await ky.get(...).json();
