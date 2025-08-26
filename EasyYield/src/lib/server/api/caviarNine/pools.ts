import { makeRateLimitedRequest } from '$shared/utils/rateLimiter/makeRateLimitedRequest';
import { CAVIARNINE_API_CONFIG, CAVIARNINE_CORE_API_URL } from './constants';
import type {
  FeeVaultsResponse,
  CaviarNineShapeLiquidityResponseStrict,
  CaviarNineTicker,
} from '$shared/typings/CaviarNine';

/**
 * Fetch ticker data from CaviarNine API
 */
export async function fetchCaviarNineTickers() {
  const tickers = await makeRateLimitedRequest<CaviarNineTicker[]>(
    `${CAVIARNINE_CORE_API_URL}/cg/tickers`,
    'CaviarNine tickers',
    CAVIARNINE_API_CONFIG
  );

  return { tickers };
}
/**
 * Fetch ticker data from CaviarNine API
 */
export async function fetchCaviarNinePool(
  componentAddress: string
): Promise<CaviarNineShapeLiquidityResponseStrict> {
  const data =
    await makeRateLimitedRequest<CaviarNineShapeLiquidityResponseStrict>(
      `${CAVIARNINE_CORE_API_URL}/shapeliquidity/${componentAddress}`,
      'CaviarNine tickers',
      CAVIARNINE_API_CONFIG
    );

  return data;
}

/**
 * Fetch fee vault data from CaviarNine API
 */
export async function fetchCaviarNineFeeVaults() {
  return await makeRateLimitedRequest<FeeVaultsResponse>(
    `${CAVIARNINE_CORE_API_URL}/fee_vaults`,
    'CaviarNine fee vaults',
    CAVIARNINE_API_CONFIG
  );
}
