import { CaviarNineAPIError } from '$server/api/caviarNine/constants';
import { updateCaviarNineProtocols } from './caviarNine';
import { updateOciswapProtocols } from './ociswap';

let isJobRunning = false;

export async function updateProtocolsJob() {
  try {
    if (isJobRunning) {
      console.warn('[WARN] Skipping: updateProtocolsJob still running.');
      return;
    }

    isJobRunning = true;
    console.log('[INFO] Starting protocol update job...');

    let totalUpdates = 0;
    let totalErrors = 0;

    // Update Ociswap pools
    try {
      const ociswapResult = await updateOciswapProtocols();
      totalUpdates += ociswapResult.updates;
      totalErrors += ociswapResult.errors;
    } catch (err) {
      console.error('[ERROR] Ociswap update failed completely:', err);
      totalErrors++;
    }

    // Update CaviarNine pools
    try {
      console.log('[INFO] Starting CaviarNine update...');
      const caviarNineResult = await updateCaviarNineProtocols();
      totalUpdates += caviarNineResult.updates;
      totalErrors += caviarNineResult.errors;
      console.log(
        `[SUCCESS] CaviarNine: ${caviarNineResult.updates} updated, ${caviarNineResult.errors} errors`
      );
    } catch (error) {
      console.error('[ERROR] CaviarNine update failed completely:', error);

      if (error instanceof CaviarNineAPIError) {
        // Handle specific API errors
        switch (error.code) {
          case 'MAX_RETRIES_EXCEEDED':
            console.error(
              '[CRITICAL] CaviarNine API unreachable after retries'
            );
            break;
          case 'HTTP_CLIENT_ERROR':
            console.error(
              `[CRITICAL] CaviarNine API client error: ${error.status}`
            );
            break;
          case 'NO_PROTOCOLS_FOUND':
            console.error('[CRITICAL] No CaviarNine protocols found');
            break;
          default:
            console.error(
              '[CRITICAL] Unknown CaviarNine API error:',
              error.message
            );
        }
      }

      totalErrors++;
    }

    console.log(
      `[DONE] Protocol update finished: ${totalUpdates} total updated, ${totalErrors} total errors.`
    );
    return { updates: totalUpdates, errors: totalErrors };
  } catch (error) {
    console.error(error);
  } finally {
    isJobRunning = false;
  }
}
