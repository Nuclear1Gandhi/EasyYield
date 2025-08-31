import ky, { HTTPError, TimeoutError } from 'ky';
import { rateLimiter } from './rateLimiter';
import { CaviarNineAPIError } from '$server/api/caviarNine/constants';

export interface RateLimitConfig {
  rateLimitKey: string;
  maxRequestsPerWindow: number;
  windowMs: number;
  maxRetries: number;
  requestTimeoutMs: number;
  retryDelayMs: number;
}

export async function makeRateLimitedRequest<T>(
  url: string,
  description: string,
  config: RateLimitConfig
): Promise<T> {
  const {
    rateLimitKey,
    maxRequestsPerWindow,
    windowMs,
    maxRetries,
    requestTimeoutMs,
    retryDelayMs,
  } = config;

  // Wait for rate limit slot
  await rateLimiter.waitForRateLimit(
    rateLimitKey,
    maxRequestsPerWindow,
    windowMs
  );

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[INFO] Fetching ${description} (attempt ${attempt}/${maxRetries})`
      );

      const response = await ky
        .get(url, {
          timeout: requestTimeoutMs,
          retry: { limit: 0 }, // manual retries
          hooks: {
            beforeRequest: [
              (request) => {
                console.log(`[API] ${request.method} ${request.url}`);
              },
            ],
          },
        })
        .json<T>();

      console.log(`[SUCCESS] ${description} fetched successfully`);
      return response;
    } catch (error: any) {
      lastError = error;

      if (error instanceof HTTPError) {
        const status = error.response.status;
        const statusText = error.response.statusText;

        console.error(
          `[HTTP_ERROR] ${description} failed: ${status} ${statusText}`
        );

        // 4xx: client errors
        if (status >= 400 && status < 500) {
          if (status === 429) {
            // Too many requests → longer wait
            console.log(`[RATE_LIMITED] 429 received, delaying`);
            await new Promise((r) => setTimeout(r, retryDelayMs * 2));
            continue;
          } else {
            throw new CaviarNineAPIError(
              `Client error for ${description}: ${status} ${statusText}`,
              status,
              'HTTP_CLIENT_ERROR'
            );
          }
        }

        // 5xx: server errors → retry
        if (status >= 500) {
          console.log(
            `[SERVER_ERROR] ${description} server error, retrying in ${retryDelayMs}ms`
          );
          await new Promise((r) => setTimeout(r, retryDelayMs));
          continue;
        }
      } else if (error instanceof TimeoutError) {
        console.log(
          `[TIMEOUT] ${description} timed out, retrying in ${retryDelayMs}ms`
        );
        await new Promise((r) => setTimeout(r, retryDelayMs));
        continue;
      } else {
        console.error(
          `[NETWORK_ERROR] ${description} network error:`,
          (error as Error).message
        );
        await new Promise((r) => setTimeout(r, retryDelayMs));
        continue;
      }
    }
  }

  // If we reach here, all retries failed
  throw new CaviarNineAPIError(
    `Failed to fetch ${description} after ${maxRetries} attempts: ${lastError?.message}`,
    undefined,
    'MAX_RETRIES_EXCEEDED',
    lastError
  );
}
