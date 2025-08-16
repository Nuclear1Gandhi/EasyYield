export type Apr = {
  '24h': string;
  '7d': string;
};

export type Fee = {
  usd: {
    '24h': string;
    '7d': string;
    total: string;
  };
  xrd: {
    '24h': string;
    '7d': string;
    total: string;
  };
};

export type Liquidity = {
  token: AnyDurationString;
  usd: AnyDurationString;
  xrd: AnyDurationString;
};
type AnyDurationString = {
  '1h': string;
  '24h': string;
  '7d': string;
  now: string;
};

export type TotalValueLocked = {
  usd: AnyDurationString;
  xrd: AnyDurationString;
};

export type Volume = {
  usd: {
    '1h': string;
    '24h': string;
    '7d': string;
    total: string;
  };
  xrd: {
    '1h': string;
    '24h': string;
    '7d': string;
    total: string;
  };
};

export type PoolToken = {
  address: string;
  icon_url: string;
  name: string;
  slug: string;
  symbol: string;
};

export type PoolTokenStats = {
  fee: {
    token: {
      '24h': string;
      '7d': string;
      total: string;
    };
    usd: {
      '24h': string;
      '7d': string;
      total: string;
    };
    xrd: {
      '24h': string;
      '7d': string;
      total: string;
    };
  };
  liquidity: AnyDurationString;
  price: AnyDurationString;
  token: PoolToken;
  total_value_locked: AnyDurationString;
  volume: {
    '1h': string;
    '24h': string;
    '7d': string;
    total: string;
  };
};

export type OciswapPool = {
  address: string;
  apr: Apr;
  base_token: string;
  blueprint_name: string;
  created_at: string;
  fee: Fee;
  fee_rate: string;
  liquidity: Liquidity;
  lp_token_address: string;
  name: string;
  pool_type: string;
  rank: number;
  slug: string;
  total_value_locked: TotalValueLocked;
  version: string;
  volume: Volume;
  x: PoolTokenStats;
  y: PoolTokenStats;
};
