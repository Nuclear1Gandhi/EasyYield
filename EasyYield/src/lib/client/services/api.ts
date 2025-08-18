import ky from 'ky';
import type { ProtocolResponse, PortfolioData } from '$shared/typings/Api';

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
  prefixUrl: '', // empty since you're using absolute paths like /api/protocols
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
  // Get all protocols (matches your existing endpoint)
  async getProtocols(): Promise<ProtocolResponse[]> {
    try {
      return await api
        .get('/api/v1/protected/protocols')
        .json<ProtocolResponse[]>();
    } catch (error: any) {
      throw new ApiError(
        error.message || 'Failed to fetch protocols',
        error.response?.status || 0,
        'PROTOCOLS_ERROR'
      );
    }
  },

  // Get specific protocol details
  async getProtocol(id: string): Promise<ProtocolResponse> {
    try {
      return await api
        .get(`/api/v1/protected/protocols/${id}`)
        .json<ProtocolResponse>();
    } catch (error: any) {
      throw new ApiError(
        error.message || 'Failed to fetch protocol',
        error.response?.status || 0,
        'PROTOCOL_ERROR'
      );
    }
  },

  // Get portfolio data
  async getPortfolio(walletAddress: string): Promise<PortfolioData> {
    try {
      return await api
        .get(`/api/v1/protected/portfolio/${walletAddress}`)
        .json<PortfolioData>();
    } catch (error: any) {
      throw new ApiError(
        error.message || 'Failed to fetch portfolio',
        error.response?.status || 0,
        'PORTFOLIO_ERROR'
      );
    }
  },

  // Get historical data for sparklines
  async getProtocolHistory(protocolId: string, days = 7): Promise<any[]> {
    try {
      return await api
        .get(`/api/v1/protected/protocols/${protocolId}/history`, {
          searchParams: { days: days.toString() },
        })
        .json<ProtocolResponse[]>();
    } catch (error: any) {
      throw new ApiError(
        error.message || 'Failed to fetch protocol history',
        error.response?.status || 0,
        'HISTORY_ERROR'
      );
    }
  },
};
