export interface BatchProcessor<TInput, TOutput> {
  batchSize: number;
  processBatch: (batch: TInput[]) => Promise<Map<TInput, TOutput>>;
}

export async function processBatches<TInput, TOutput>(
  items: TInput[],
  processor: BatchProcessor<TInput, TOutput>,
  options?: {
    onBatchError?: (error: Error, batch: TInput[]) => Map<TInput, TOutput>;
    onProgress?: (processed: number, total: number) => void;
  }
): Promise<Map<TInput, TOutput>> {
  const results = new Map<TInput, TOutput>();

  if (items.length === 0) return results;

  const { batchSize, processBatch } = processor;
  const totalBatches = Math.ceil(items.length / batchSize);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;

    try {
      const batchResults = await processBatch(batch);
      batchResults.forEach((value, key) => results.set(key, value));

      options?.onProgress?.(
        Math.min(i + batchSize, items.length),
        items.length
      );
    } catch (error) {
      console.warn(`Batch ${batchNumber}/${totalBatches} failed:`, error);

      if (options?.onBatchError) {
        const fallbackResults = options.onBatchError(error as Error, batch);
        fallbackResults.forEach((value, key) => results.set(key, value));
      }
    }
  }

  return results;
}
