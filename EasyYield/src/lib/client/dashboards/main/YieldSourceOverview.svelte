<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Badge, Button } from 'flowbite-svelte';

  type YieldSource = {
    name: string;
    apy: string;
    tvl: string;
    change: string;
    status: 'growing' | 'stable' | 'volatile';
    icon: string;
  };

  type Props = {
    yieldSources: YieldSource[];
    onViewDetails?: (yieldSource: YieldSource) => void;
  };

  let { yieldSources, onViewDetails }: Props = $props();

  function getBadgeColor(status: string) {
    switch (status) {
      case 'growing': return 'green';
      case 'stable': return 'blue';
      case 'volatile': return 'yellow';
      default: return 'gray';
    }
  }
</script>

<section class="yield-source-overview">
  <h2>Yield Sources Overview</h2>
  <div class="yield-sources-cards">
    {#each yieldSources as yieldSource}
      <div class="yield-source-card">
        <div class="yield-source-header">
          <div class="yield-source-info">
            <Icon icon={yieldSource.icon} width="20" height="20" class="yield-source-icon" />
            <h3>{yieldSource.name}</h3>
          </div>
          <Badge color={getBadgeColor(yieldSource.status)}>
            {yieldSource.status}
          </Badge>
        </div>
        
        <div class="yield-source-metrics">
          <div class="metric">
            <span class="metric-label">APY</span>
            <span class="metric-value">{yieldSource.apy}%</span>
            <span class="metric-change {yieldSource.change.startsWith('+') ? 'positive' : 'negative'}">
              {yieldSource.change}%
            </span>
          </div>
          <div class="metric">
            <span class="metric-label">TVL</span>
            <span class="metric-value">{yieldSource.tvl} XRD</span>
          </div>
        </div>

        <!-- Mock sparkline -->
        <div class="sparkline">
          <div class="sparkline-bar" style="height: 60%"></div>
          <div class="sparkline-bar" style="height: 80%"></div>
          <div class="sparkline-bar" style="height: 45%"></div>
          <div class="sparkline-bar" style="height: 90%"></div>
          <div class="sparkline-bar" style="height: 75%"></div>
          <div class="sparkline-bar" style="height: 100%"></div>
        </div>

        <Button 
          size="sm" 
          color="alternative" 
          class="w-full mt-3"
          onclick={() => onViewDetails?.(yieldSource)}
        >
          View Details
        </Button>
      </div>
    {/each}
  </div>
</section>

<style lang="scss">
  .yield-source-overview h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--fg);
  }

  .yield-sources-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }

  .yield-source-card {
    background: var(--surface-1);
    border: 1px solid var(--border-weak);
    border-radius: var(--radius);
    padding: 20px;
    transition: border-color var(--dur-med) var(--easing-standard);

    &:hover {
      border-color: var(--border-strong);
    }
  }

  .yield-source-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .yield-source {
    display: flex;
    align-items: center;
    gap: 8px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .yield-source-icon {
      color: var(--primary);
    }
  }

  .yield-source-metrics {
    display: flex;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .metric {
    display: flex;
    flex-direction: column;
    gap: 4px;

    .metric-label {
      font-size: 12px;
      color: var(--gray-400);
    }

    .metric-value {
      font-size: 18px;
      font-weight: 600;
    }

    .metric-change {
      font-size: 12px;
      &.positive { color: var(--success); }
      &.negative { color: var(--danger); }
    }
  }

  .sparkline {
    display: flex;
    align-items: end;
    gap: 2px;
    height: 32px;
    margin-bottom: 16px;

    .sparkline-bar {
      flex: 1;
      background: var(--primary);
      border-radius: 1px;
      opacity: 0.6;
      transition: opacity var(--dur-med) var(--easing-standard);

      &:hover {
        opacity: 1;
      }
    }
  }
</style>
