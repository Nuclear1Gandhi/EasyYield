import ky, { type KyResponse } from 'ky';
import { OCISWAP_API_URL } from './constants';
import type { OciswapPool } from '$shared/typings/Ociswap';

export async function fetchTopOciswapPools(
  limit: number = 30
): Promise<OciswapPool[]> {
  try {
    const url = `${OCISWAP_API_URL}/pools?limit=${limit}`;
    const response = await ky
      .get(url, { timeout: 10000, retry: { limit: 3 } })
      .json<{ data: OciswapPool[] }>();
    return response.data;
  } catch (error) {
    console.error(error);
    return [];
  }
}
