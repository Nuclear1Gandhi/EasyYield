<script lang="ts">
  import { Alert, Spinner } from 'flowbite-svelte';
  import { dashboardStore } from '$client/stores/dashboard';
  import HeroStats from './HeroStats.svelte';
  import StrategyRecommendations from './StrategyRecommendations.svelte';
  import ActivityFeed from './ActivityFeed.svelte';
  import YieldSourceComparisonTable from './YieldSourceComparisonTable.svelte';

  // Subscribe to dashboard store
  let dashboardData = $derived($dashboardStore);
  dashboardStore.subscribe(value => dashboardData = value);

  // Computed hero stats for top yield opportunities & movement summary

  let heroStats = $derived([
    { 
      icon: 'tabler:trophy', 
      label: 'Top Opportunity', 
      value: getBestYieldWithApy() // e.g. "Ociswap XRD/USDT (12.4%)"
    },
    { 
      icon: 'tabler:alert-triangle', 
      label: 'Yield Changes Today', 
      value: getYieldMovementSummary() // e.g. "3 up, 1 down"
    },
    { 
      icon: 'tabler-trending-up', 
      label: 'Market Benchmark', 
      value: getAverageApy() + '% avg'
    },
  ]);

  // Get average APY across all yield sources, fallback to 0.00
  function getAverageApy(): string {
    if (dashboardData.yieldSources.length === 0) return '0.00';
    const total = dashboardData.yieldSources.reduce((sum, yieldSource) => {
      return sum + parseFloat(yieldSource.currentApy || '0');
    }, 0);
    return (total / dashboardData.yieldSources.length).toFixed(2);
  }

  // Get best yield source with highest APY
  function getBestYieldWithApy(): string {
    if (dashboardData.yieldSources.length === 0) return '--';
    const best = dashboardData.yieldSources.reduce((prev, current) => {
      return parseFloat(current.currentApy) > parseFloat(prev.currentApy) ? current : prev;
    });
    return `${best.name.slice(0, 15)} (${parseFloat(best.currentApy).toFixed(1)}%)`;
  }

  // Summarize yield movement with simple up/down counts
  function getYieldMovementSummary(): string {
    // Use 7d avg vs current to estimate movement if available, fallback to mock
    if (dashboardData.yieldSources.length === 0) return 'No changes';

    let upCount = 0;
    let downCount = 0;

    dashboardData.yieldSources.forEach(source => {
      const current = parseFloat(source.currentApy);
      const avg7d = source.metrics?.apy7dAvg ? parseFloat(source.metrics.apy7dAvg) : current;
      if (current > avg7d) upCount++;
      else if (current < avg7d) downCount++;
    });

    if (upCount === 0 && downCount === 0) return 'No changes';
    return `${upCount} up, ${downCount} down`;
  }

  // Mock strategies (purely UI - no portfolio integration)
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

  // Mock recent activity feed
  let recentActivity = [
    { yieldSource: 'CaviarNine', action: 'APY updated', value: 'New rate', time: '2 hours ago' },
    { yieldSource: 'Ociswap', action: 'Pool data refreshed', value: 'Latest TVL', time: '5 hours ago' },
    { yieldSource: 'XRD Staking', action: 'Metrics computed', value: '7d average', time: '1 day ago' }
  ];

  function handleViewDetails(yieldSource: any) {
    console.log('Navigate to:', yieldSource.name);
    // TODO: Implement navigation to yield source details page
  }

  function handleApplyStrategy(strategy: any) {
    console.log('Apply strategy:', strategy.type);
    // TODO: Implement strategy application logic
  }

  function handleRefresh() {
    dashboardStore.refreshAll();
  }
</script>

<div class="dashboard">
  <!-- Error states -->
  {#if Object.values(dashboardData.errors).some(error => error !== null)}
    <Alert color="red" dismissable>
      <span class="font-medium">Data loading error:</span>
      {Object.values(dashboardData.errors).find(error => error !== null)}
      <button onclick={handleRefresh} class="ml-2 underline">
        Try again
      </button>
    </Alert>
  {/if}

  <!-- Loading state for initial load -->
  {#if dashboardData.loading.yieldSources && dashboardData.yieldSources.length === 0}
    <div class="loading-state">
      <Spinner size="8" />
      <p>Loading dashboard data...</p>
    </div>
  {:else}
    <HeroStats stats={heroStats} />

    <div class="dashboard-grid">
      <div class="main-content">
        <YieldSourceComparisonTable yieldSources={dashboardData.yieldSources}  />
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
