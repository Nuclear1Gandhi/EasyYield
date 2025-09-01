// src/client/stores/dashboardStore.ts
import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { apiService } from '$client/services/api';
import type {
  YieldSourceDisplayData,
  YieldSourceData,
} from '$shared/typings/Api';

type DashboardState = {
  yieldSources: YieldSourceDisplayData[];
  portfolio: YieldSourceData | null;
  loading: {
    yieldSources: boolean;
    portfolio: boolean;
  };
  errors: {
    yieldSources: string | null;
    portfolio: string | null;
  };
  lastUpdated: string | null;
};

const initialState: DashboardState = {
  yieldSources: [],
  portfolio: null,
  loading: { yieldSources: false, portfolio: false },
  errors: { yieldSources: null, portfolio: null },
  lastUpdated: null,
};

function createDashboardStore() {
  const { subscribe, update } = writable<DashboardState>(initialState);

  const setLoading = (key: keyof DashboardState['loading'], value: boolean) =>
    update((s) => ({ ...s, loading: { ...s.loading, [key]: value } }));

  const setError = (
    key: keyof DashboardState['errors'],
    error: string | null
  ) => update((s) => ({ ...s, errors: { ...s.errors, [key]: error } }));

  return {
    subscribe,
    hydrate(data: {
      yieldSources: YieldSourceDisplayData[]; // No more raw transform
    }) {
      update((state) => ({
        ...state,
        ...(data.yieldSources && { yieldSources: data.yieldSources }),
        lastUpdated: new Date().toISOString(),
      }));
    },
    async loadYieldSources() {
      if (!browser) return;
      setLoading('yieldSources', true);
      setError('yieldSources', null);

      try {
        const yieldSources = await apiService.getYieldSources();
        update((s) => ({
          ...s,
          yieldSources,
          lastUpdated: new Date().toISOString(),
        }));
      } catch (err: any) {
        const msg = err.message || 'Failed to load yield sources';
        setError('yieldSources', msg);
        console.error(msg, err);
      } finally {
        setLoading('yieldSources', false);
      }
    },

    async loadPortfolio(walletAddress: string) {
      if (!browser) return;
      setLoading('portfolio', true);
      setError('portfolio', null);

      try {
        const portfolio = await apiService.getPortfolio(walletAddress);
        update((s) => ({ ...s, portfolio }));
      } catch (err: any) {
        const msg = err.message || 'Failed to load portfolio';
        setError('portfolio', msg);
        console.error(msg, err);
      } finally {
        setLoading('portfolio', false);
      }
    },

    async refreshAll(walletAddress?: string) {
      if (!browser) return;
      const tasks = [this.loadYieldSources()];
      if (walletAddress) tasks.push(this.loadPortfolio(walletAddress));
      await Promise.allSettled(tasks);
    },
  };
}

export const dashboardStore = createDashboardStore();
