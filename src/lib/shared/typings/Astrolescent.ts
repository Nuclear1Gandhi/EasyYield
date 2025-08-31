export interface AstrolescentToken {
  address: string;
  symbol: string;
  name: string;
  description: string;
  iconUrl: string;
  infoUrl: string;
  divisibility: number;
}

export interface AstrolescentPrice extends AstrolescentToken {
  tokenPriceXRD: number;
  tokenPriceUSD: number;
  diff24H: number;
  diff24HUSD: number;
  diff7Days: number;
  diff7DaysUSD: number;
  icon_url: string;
}

export type AstrolescentPricesResponse = Record<string, AstrolescentPrice>;
