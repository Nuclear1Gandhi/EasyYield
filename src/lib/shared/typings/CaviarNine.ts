import type { TokenMetadata } from '$server/services/tokenCache';

export interface CaviarNinePool {
  address: string;
  name: string;
  type: 'DEX' | 'LSU';
  apy?: string;
  apr?: string;
  tvl?: string;
  token0?: { symbol: string | null; name: string | null; address: string };
  token1?: { symbol: string | null; name: string | null; address: string };
}

export type CaviarNinePoolResponse = {
  // Based on CoinGecko-style API and fee vaults endpoint
  pools?: any[];
  data?: any[];
};

export interface RawCaviarNineHyperstakePool {
  // Core identification
  poolId: string;
  poolType: 'TICKER' | 'LSU_POOL' | 'HYPERSTAKE';

  // Token data for TVL calculation
  tokens: Array<{
    address: string;
    symbol: string | null;
    amount: string; // Raw amount with decimals
    decimals: number;
  }>;

  // Pool metadata
  name: string;
  hasVault: boolean;
  vaultAddress?: string;
  swapFee?: string;

  // Raw API data for later processing
  rawApiData: any;
}

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
  hasVault: boolean;
  poolCategory: 'PREMIUM_VAULT' | 'BASIC_DEX';
  vaultBenefits: string[];
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

export type CaviarNineLSUPool = {
  // Pool identification
  pool_address: string;
  pool_id?: string;

  // LSU Token information
  lsu_token_address: string;
  lsu_token_symbol?: string;
  lsu_token_name?: string;

  // Underlying staking information
  underlying_validator_addresses?: string[];
  total_stake_units?: string;

  // Financial metrics
  total_value_locked: string; // In XRD
  apy?: number;
  current_exchange_rate?: string; // LSU to XRD rate
  nav_price?: string; // Net Asset Value price
  market_price?: string;

  // Pool metrics
  total_lsu_supply?: string;
  backing_xrd_amount?: string;
  liquidity_pool_tvl?: string;

  // Trading/swap information
  trading_volume_24h?: string;
  trading_volume_7d?: string;
  swap_count_24h?: number;

  // Yield breakdown
  staking_apy?: number;
  trading_fees_apy?: number;
  protocol_rewards_apy?: number;

  // Pool features
  instant_swap_enabled?: boolean;
  instant_unstake_enabled?: boolean;
  impermanent_loss_protection?: boolean;

  // Fee structure
  management_fee?: number; // As percentage
  performance_fee?: number;
  swap_fee?: number;
  unstake_fee?: number;

  // Timestamps
  created_at?: string;
  last_updated?: string;

  // Pool status
  is_active?: boolean;
  is_deprecated?: boolean;

  // Additional metadata
  description?: string;
  pool_type?: 'LSU_BASIC' | 'LSU_ENHANCED' | 'LSU_HYPERSTAKE';

  // Validator information (for LSU pools)
  validators?: Array<{
    address: string;
    allocation_percentage: number;
    uptime?: number;
    fee_percentage?: number;
  }>;

  // Revenue sharing (specific to CaviarNine's model)
  revenue_sharing?: {
    trading_revenue_share?: number;
    protocol_revenue_share?: number;
    validator_reward_share?: number;
  };

  // Risk metrics
  volatility_30d?: number;
  max_drawdown?: number;
  correlation_with_xrd?: number;
};

// Extended interface for internal processing
export type CaviarNineLSUPoolWithMetrics = {
  // Computed metrics
  premium_discount?: number; // Market price vs NAV
  liquidity_utilization?: number;
  volume_to_tvl_ratio?: number;

  // Enhanced yield breakdown
  effective_apy?: number;
  compound_frequency?: 'CONTINUOUS' | 'DAILY' | 'WEEKLY';

  // Additional tracking
  price_history_7d?: Array<{
    timestamp: string;
    price: number;
    volume?: number;
  }>;

  // Pool health indicators
  health_score?: number;
  risk_rating?: 'LOW' | 'MEDIUM' | 'HIGH';
} & CaviarNineLSUPool;

// For API responses that might contain multiple pools
export type CaviarNineLSUPoolResponse = {
  pools: CaviarNineLSUPool[];
  total_count?: number;
  page?: number;
  limit?: number;
  total_tvl?: string;
  average_apy?: number;
};

// new ---

export type ExtractedPoolMetadata = {
  token_x: string;
  token_y: string;
  liquidity_receipt: string;
  name: string;
  description: string;
  tags: string[];
};

export type ExtractedPoolFungibleResource = {
  resourceAddress: string;
  amount: string; // keep string for precision
  vaultAddress: string | null;
};

export type BaseExtractedPoolInfo = {
  address: string;
  fungibleResources: ExtractedPoolFungibleResource[];
  metadata: ExtractedPoolMetadata;
  state: {
    validator_address_map?: string | null;
    bin_span?: number;
    lsu_to_validator?: string | null;
    token_validator?: string | null;
    tick_index_current?: number | null;
    lower_limit?: string; // decimals as strings
    upper_limit?: string;
    active_x?: string;
    active_y?: string;
    active_total_claim?: string;
    liquidity_receipt_manager?: string;
    tokens_x?: string;
    tokens_y?: string;
  };
  roles: {
    owner: any | null;
    entries: any[];
  };
};

export type PoolInfoFungibleResource = ExtractedPoolFungibleResource &
  TokenMetadata & { price: number };

export type PoolInfo = Omit<BaseExtractedPoolInfo, 'fungibleResources'> & {
  fungibleResources: PoolInfoFungibleResource[];
};

// Shape liquidity
interface ChartDataArrays {
  high: string[];
  low: string[];
  open: string[];
  close: string[];
}

export type CaviarNineShapeLiquidityResponseStrict = {
  last_updated: string;
  component_address: string;
  liquidity_receipt_address: string;
  token_x_address: string;
  token_y_address: string;
  token_x_name: string;
  token_x_symbol: string;
  token_y_name: string;
  token_y_symbol: string;
  bin_size: number;
  status: string;
  amounts: {
    token_x: string;
    token_x_in_xrd_attos: number;
    token_y: string;
    token_y_in_xrd_attos: number;
    tvl_in_xrd_attos: number;
  };
  price: string;
  price_token_x_to_xrd: string;
  price_token_y_to_xrd: string;
  decimals: {
    token_x: number;
    token_y: number;
    price: number;
  };
  volume: {
    all_in_xrd_attos: number;
    '24h_in_xrd_attos': number;
    '7d_in_xrd_attos': number;
  };
  bin_width_perc: string;
  active_tick: string;
  active_tick_xy_ratio: string;
  fees_perc: string;
  apy_perc: string;
  chart_data: {
    time: {
      time_interval: string[];
      unix_time_interval: number[];
    };
    tvl_in_xrd_attos: ChartDataArrays;
    price: ChartDataArrays;
    volume_in_xrd_attos: ChartDataArrays;
    apy: ChartDataArrays;
  };
  bin_amounts_in_xrd_attos: Record<string, number>;
};
