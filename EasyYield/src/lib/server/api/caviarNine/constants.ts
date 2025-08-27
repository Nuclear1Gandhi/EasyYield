export const CAVIARNINE_CORE_API_URL = 'https://api-core.caviarnine.com/v1.0';
export const CAVIARNINE_RATE_LIMIT_KEY = 'caviarnine_api';
export const CAVIARNINE_MAX_REQUESTS_PER_MINUTE = 10;
export const CAVIARNINE_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const CAVIARNINE_REQUEST_TIMEOUT_MS = 30000; // 30 seconds
export const CAVIARNINE_MAX_RETRIES = 3;
export const CAVIARNINE_RETRY_DELAY_MS = 2000; // 2 seconds

export interface CaviarNineError extends Error {
  status?: number;
  code?: string;
  response?: any;
}

export class CaviarNineAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public response?: any
  ) {
    super(message);
    this.name = 'CaviarNineAPIError';
  }
}

export const CAVIARNINE_API_CONFIG = {
  rateLimitKey: CAVIARNINE_RATE_LIMIT_KEY,
  maxRequestsPerWindow: CAVIARNINE_MAX_REQUESTS_PER_MINUTE,
  windowMs: CAVIARNINE_RATE_LIMIT_WINDOW_MS,
  maxRetries: CAVIARNINE_MAX_RETRIES,
  requestTimeoutMs: CAVIARNINE_REQUEST_TIMEOUT_MS,
  retryDelayMs: CAVIARNINE_RETRY_DELAY_MS,
};
