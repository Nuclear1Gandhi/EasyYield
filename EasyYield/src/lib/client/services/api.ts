import ky from 'ky';
import type { YieldSourceResponse, YieldSourceData } from '$shared/typings/Api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Configure ky instance with your base settings
const api = ky.create({
  prefixUrl: '', // empty since you're using absolute paths like /api/yield-sources
  timeout: 30000,
  retry: {
    limit: 2,
    methods: ['get'],
  },
  hooks: {
    beforeError: [
      (error) => {
        const { response } = error;
        if (response && response.body) {
          error.name = 'ApiError';
          error.message = `${response.status}: ${response.statusText}`;
        }
        return error;
      },
    ],
  },
});

export const apiService = {
  // Get all yield sources (matches your existing endpoint)
  async getYieldSources(): Promise<YieldSourceResponse[]> {
    try {
      return await api
        .get('/api/v1/protected/yield-sources')
        .json<YieldSourceResponse[]>();
    } catch (error: any) {
      throw new ApiError(
        error.message || 'Failed to fetch yiled sources',
        error.response?.status || 0,
        'YIELD_SOURCES_ERROR'
      );
    }
  },

  // Get specific yield source details
  async getYieldSource(id: string): Promise<YieldSourceResponse> {
    try {
      return await api
        .get(`/api/v1/protected/yield-sources/${id}`)
        .json<YieldSourceResponse>();
    } catch (error: any) {
      throw new ApiError(
        error.message || 'Failed to fetch yield source',
        error.response?.status || 0,
        'YIELD_SOURCE_ERROR'
      );
    }
  },

  // Get portfolio data
  async getPortfolio(walletAddress: string): Promise<YieldSourceData> {
    try {
      return await api
        .get(`/api/v1/protected/portfolio/${walletAddress}`)
        .json<YieldSourceData>();
    } catch (error: any) {
      throw new ApiError(
        error.message || 'Failed to fetch portfolio',
        error.response?.status || 0,
        'PORTFOLIO_ERROR'
      );
    }
  },

  // Get historical data for sparklines
  async getYieldSourceHistory(
    yieldSourceAddress: string,
    days = 7
  ): Promise<any[]> {
    try {
      return await api
        .get(`/api/v1/protected/yield-sources/${yieldSourceAddress}/history`, {
          searchParams: { days: days.toString() },
        })
        .json<YieldSourceResponse[]>();
    } catch (error: any) {
      throw new ApiError(
        error.message || 'Failed to fetch yield source history',
        error.response?.status || 0,
        'HISTORY_ERROR'
      );
    }
  },
};
