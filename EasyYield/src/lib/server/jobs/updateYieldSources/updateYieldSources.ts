import { computeAndUpsertMetrics } from '$server/yieldSourceMetrics/computeAndUpsertMetrics';
import { updateOciswapYieldSources } from './ociswap';
import { updateCaviarNineYieldSources } from './caviarNine';

let isJobRunning = false;

export async function updateYieldSourcesJob() {
  try {
    if (isJobRunning) {
      console.warn('[WARN] Skipping: updateYieldSourcesJob still running.');
      return;
    }
    isJobRunning = true;
    console.log('[INFO] Starting unified yield sources update job...');

    let totalUpdates = 0;
    let totalErrors = 0;
    let allUpdatedIds: string[] = [];

    // ✅ OPTION 1: Process separately (current approach)
    const ociswapResult = await updateOciswapYieldSources();
    const caviarNineResult = await updateCaviarNineYieldSources();

    // Aggregate results (Option 1)
    totalUpdates = ociswapResult.updates + caviarNineResult.updates;
    totalErrors = ociswapResult.errors + caviarNineResult.errors;
    allUpdatedIds = [
      ...ociswapResult.updatedIds,
      ...caviarNineResult.updatedIds,
    ];

    // ✅ Compute metrics for all updated yield sources
    if (allUpdatedIds.length > 0) {
      console.log(
        `[INFO] Computing metrics for ${allUpdatedIds.length} updated yield sources...`
      );
      const metricsStartTime = Date.now();

      allUpdatedIds = [...new Set(allUpdatedIds)]; // dedupe

      let metricsUpdated = 0;
      for (const yieldSourceId of allUpdatedIds) {
        try {
          await computeAndUpsertMetrics(yieldSourceId);
          metricsUpdated++;
        } catch (err) {
          console.error(
            `[ERROR] Failed to compute metrics for ${yieldSourceId}:`,
            err
          );
          totalErrors++;
        }
      }

      console.log(
        `[SUCCESS] Metrics computed for ${metricsUpdated}/${allUpdatedIds.length} yield sources (${Date.now() - metricsStartTime}ms)`
      );
    }

    console.log(
      `[DONE] Unified update finished: ${totalUpdates} total updated, ${totalErrors} total errors.`
    );
    return {
      updates: totalUpdates,
      errors: totalErrors,
      updatedIds: allUpdatedIds,
    };
  } catch (error) {
    console.error('[ERROR] Unified yield sources job failed:', error);
    return { updates: 0, errors: 1, updatedIds: [] };
  } finally {
    isJobRunning = false;
  }
}
