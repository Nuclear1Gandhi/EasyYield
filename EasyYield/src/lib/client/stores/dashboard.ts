import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import { apiService } from '$client/services/api';
import type {
  ProtocolResponse,
  ProtocolDisplayData,
  PortfolioData,
} from '$shared/typings/Api';
import { transformProtocolData } from '$shared/utils/dataTransform';

type DashboardState = {
  protocols: ProtocolDisplayData[];
  rawProtocols: ProtocolResponse[];
  portfolio: PortfolioData | null;
  loading: {
    protocols: boolean;
    portfolio: boolean;
  };
  errors: {
    protocols: string | null;
    portfolio: string | null;
  };
  lastUpdated: string | null;
};

const initialState: DashboardState = {
  protocols: [],
  rawProtocols: [],
  portfolio: null,
  loading: {
    protocols: false,
    portfolio: false,
  },
  errors: {
    protocols: null,
    portfolio: null,
  },
  lastUpdated: null,
};

function createDashboardStore() {
  const { subscribe, update } = writable<DashboardState>(initialState);

  const setLoading = (key: keyof DashboardState['loading'], value: boolean) => {
    update((state) => ({
      ...state,
      loading: { ...state.loading, [key]: value },
    }));
  };

  const setError = (
    key: keyof DashboardState['errors'],
    error: string | null
  ) => {
    update((state) => ({
      ...state,
      errors: { ...state.errors, [key]: error },
    }));
  };

  return {
    subscribe,
    hydrate(data: {
      protocols?: ProtocolResponse[];
      portfolio?: PortfolioData | null;
    }) {
      update((state) => {
        const updates: Partial<DashboardState> = {
          lastUpdated: new Date().toISOString(),
        };

        if (data.protocols) {
          updates.rawProtocols = data.protocols;
          updates.protocols = data.protocols.map(transformProtocolData);
        }

        if (data.portfolio !== undefined) {
          updates.portfolio = data.portfolio;
        }

        return { ...state, ...updates };
      });
    },

    async loadProtocols() {
      // Only run in browser
      if (!browser) return;

      setLoading('protocols', true);
      setError('protocols', null);

      try {
        const rawProtocols = await apiService.getProtocols();
        const protocols = rawProtocols.map(transformProtocolData);

        update((state) => ({
          ...state,
          rawProtocols,
          protocols,
          lastUpdated: new Date().toISOString(),
        }));
      } catch (error: any) {
        const message = error.message || 'Failed to load protocols';
        setError('protocols', message);
        console.error('Failed to load protocols:', error);
      } finally {
        setLoading('protocols', false);
      }
    },

    async loadPortfolio(walletAddress: string) {
      if (!browser) return;

      setLoading('portfolio', true);
      setError('portfolio', null);

      try {
        const portfolio = await apiService.getPortfolio(walletAddress);
        update((state) => ({ ...state, portfolio }));
      } catch (error: any) {
        const message = error.message || 'Failed to load portfolio';
        setError('portfolio', message);
        console.error('Failed to load portfolio:', error);
      } finally {
        setLoading('portfolio', false);
      }
    },

    async refreshAll(walletAddress?: string) {
      if (!browser) return;

      const promises = [this.loadProtocols()];
      if (walletAddress) {
        promises.push(this.loadPortfolio(walletAddress));
      }

      await Promise.allSettled(promises);
    },
  };
}

export const dashboardStore = createDashboardStore();
