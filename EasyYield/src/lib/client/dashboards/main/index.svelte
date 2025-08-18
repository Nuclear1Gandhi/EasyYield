<script lang="ts">
  import { Alert, Spinner } from 'flowbite-svelte';
  import { dashboardStore } from '$client/stores/dashboard';
  import { formatNumber } from '$shared/utils/dataTransform';
  import HeroStats from './HeroStats.svelte';
  import ProtocolOverview from './ProtocolOverview.svelte';
  import StrategyRecommendations from './StrategyRecommendations.svelte';
  import ActivityFeed from './ActivityFeed.svelte';
  import ProtocolComparisonTable from './YieldSourceComparisonTable.svelte';


  // Subscribe to dashboard store
  let dashboardData = $derived($dashboardStore);
  dashboardStore.subscribe(value => dashboardData = value);

  // Computed hero stats from real data
  let heroStats = $derived([
    { 
      icon: 'tabler:wallet', 
      label: 'Portfolio Value', 
      value: dashboardData.portfolio?.totalValue 
        ? `${formatNumber(dashboardData.portfolio.totalValue)} XRD`
        : 'Connect Wallet',
      isPrimary: true 
    },
    { 
      icon: 'tabler:trending-up', 
      label: 'Average APY', 
      value: getAverageApy() + '%'
    },
    { 
      icon: 'tabler:star', 
      label: 'Best Yield Source', 
      value: getBestProtocol() 
    },
    { 
      icon: 'tabler:apps', 
      label: 'Active Yield Sources', 
      value: dashboardData.protocols.length.toString() 
    }
  ]);

  function getBestProtocol(): string {
    if (dashboardData.protocols.length === 0) return '--';
    const best = dashboardData.protocols.reduce((prev, current) => 
      parseFloat(current.apy) > parseFloat(prev.apy) ? current : prev
    );
    return best.name.slice(0,11);
  }

  function getAverageApy(): string {
    if (dashboardData.rawProtocols.length === 0) return '0.00';
    
    const total = dashboardData.rawProtocols.reduce((sum, protocol) => {
      return sum + parseFloat(protocol.currentApy || '0');
    }, 0);
    
    return (total / dashboardData.rawProtocols.length).toFixed(2);
  }

  // Mock strategies (you can add this to your backend later)
  let strategies = [
    {
      type: 'Conservative',
      apy: '7.2',
      risk: 'Low',
      allocation: { xrd: 70, caviarnine: 30, ociswap: 0 },
      color: 'success' as const
    },
    {
      type: 'Balanced',
      apy: '8.8',
      risk: 'Medium',
      allocation: { xrd: 40, caviarnine: 40, ociswap: 20 },
      color: 'primary' as const
    },
    {
      type: 'Aggressive',
      apy: '11.5',
      risk: 'High',
      allocation: { xrd: 20, caviarnine: 30, ociswap: 50 },
      color: 'warning' as const
    }
  ];

  // Mock activity (you can add this to your backend later)
  let recentActivity = [
    { protocol: 'CaviarNine', action: 'APY updated', value: 'New rate', time: '2 hours ago' },
    { protocol: 'Ociswap', action: 'Pool data refreshed', value: 'Latest TVL', time: '5 hours ago' },
    { protocol: 'XRD Staking', action: 'Metrics computed', value: '7d average', time: '1 day ago' }
  ];

  function handleViewDetails(protocol: any) {
    console.log('Navigate to:', protocol.name);
    // TODO: Navigate to protocol details page
  }

  function handleApplyStrategy(strategy: any) {
    console.log('Apply strategy:', strategy.type);
    // TODO: Implement strategy application
  }

  function handleRefresh() {
    dashboardStore.refreshAll();
  }
</script>

<div class="dashboard">
  <!-- Error states -->
  {#if Object.values(dashboardData.errors).some(error => error !== null)}
    <Alert color="red" dismissible>
      <span class="font-medium">Data loading error:</span>
      {Object.values(dashboardData.errors).find(error => error !== null)}
      <button onclick={handleRefresh} class="ml-2 underline">
        Try again
      </button>
    </Alert>
  {/if}

  <!-- Loading state for initial load -->
  {#if dashboardData.loading.protocols && dashboardData.protocols.length === 0}
    <div class="loading-state">
      <Spinner size="8" />
      <p>Loading dashboard data...</p>
    </div>
  {:else}
    <HeroStats stats={heroStats} />

    <div class="dashboard-grid">
      <div class="main-content">
        <ProtocolComparisonTable protocols={dashboardData.protocols}></ProtocolComparisonTable>
      </div>
      
      <div class="sidebar-content">
        <StrategyRecommendations 
          {strategies} 
          onApplyStrategy={handleApplyStrategy}
        />
        <ActivityFeed 
          activities={recentActivity}
        />
      </div>
    </div>
  {/if}

  <!-- Last updated indicator -->
  {#if dashboardData.lastUpdated}
    <div class="last-updated">
      Last updated: {new Date(dashboardData.lastUpdated).toLocaleTimeString()}
      <button onclick={handleRefresh} class="refresh-btn">
        Refresh
      </button>
    </div>
  {/if}
</div>

<style lang="scss">
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 20px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 60px;
    color: var(--gray-400);
  }

  .dashboard-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;

    @media (max-width: 1200px) {
      grid-template-columns: 1fr;
    }
  }

  .sidebar-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .last-updated {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--surface-1);
    border: 1px solid var(--border-weak);
    border-radius: var(--radius);
    font-size: 14px;
    color: var(--gray-400);

    .refresh-btn {
      color: var(--primary);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 14px;
      text-decoration: underline;

      &:hover {
        color: var(--primary-hover);
      }
    }
  }
</style>
