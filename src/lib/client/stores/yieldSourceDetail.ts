import { writable } from 'svelte/store';
import type {
  YieldSourceDisplayData,
  YieldSourceHistoricalData,
} from '$shared/typings/Api';

interface YieldSourceDetailState {
  yieldSource: YieldSourceDisplayData | null;
  historicalData: YieldSourceHistoricalData[] | null;
  relatedSources: YieldSourceDisplayData[];
  loading: boolean;
  error: string | null;
}

const initialState: YieldSourceDetailState = {
  yieldSource: null,
  historicalData: null,
  relatedSources: [],
  loading: false,
  error: null,
};

function createYieldSourceDetailStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    loadYieldSource: async (id: string) => {
      update((state) => ({ ...state, loading: true, error: null }));

      try {
        // TODO: Replace with actual API calls
        const [yieldSourceResponse, historicalResponse, relatedResponse] =
          await Promise.all([
            fetch(`/api/yield-sources/${id}`),
            fetch(`/api/yield-sources/${id}/historical`),
            fetch(`/api/yield-sources/${id}/related`),
          ]);

        const yieldSource = await yieldSourceResponse.json();
        const historicalData = await historicalResponse.json();
        const relatedSources = await relatedResponse.json();

        update((state) => ({
          ...state,
          yieldSource,
          historicalData,
          relatedSources,
          loading: false,
        }));
      } catch (error) {
        update((state) => ({
          ...state,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load yield source',
        }));
      }
    },
    reset: () => set(initialState),
  };
}

export const yieldSourceDetailStore = createYieldSourceDetailStore();
