<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Badge, Button } from 'flowbite-svelte';

  type Protocol = {
    name: string;
    apy: string;
    tvl: string;
    change: string;
    status: 'healthy' | 'stable' | 'volatile';
    icon: string;
  };

  type Props = {
    protocols: Protocol[];
    onViewDetails?: (protocol: Protocol) => void;
  };

  let { protocols, onViewDetails }: Props = $props();

  function getBadgeColor(status: string) {
    switch (status) {
      case 'healthy': return 'green';
      case 'stable': return 'blue';
      case 'volatile': return 'yellow';
      default: return 'gray';
    }
  }
</script>

<section class="protocol-overview">
  <h2>Protocol Overview</h2>
  <div class="protocol-cards">
    {#each protocols as protocol}
      <div class="protocol-card">
        <div class="protocol-header">
          <div class="protocol-info">
            <Icon icon={protocol.icon} width="20" height="20" class="protocol-icon" />
            <h3>{protocol.name}</h3>
          </div>
          <Badge color={getBadgeColor(protocol.status)}>
            {protocol.status}
          </Badge>
        </div>
        
        <div class="protocol-metrics">
          <div class="metric">
            <span class="metric-label">APY</span>
            <span class="metric-value">{protocol.apy}%</span>
            <span class="metric-change {protocol.change.startsWith('+') ? 'positive' : 'negative'}">
              {protocol.change}%
            </span>
          </div>
          <div class="metric">
            <span class="metric-label">TVL</span>
            <span class="metric-value">{protocol.tvl} XRD</span>
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
          onclick={() => onViewDetails?.(protocol)}
        >
          View Details
        </Button>
      </div>
    {/each}
  </div>
</section>

<style lang="scss">
  .protocol-overview h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--fg);
  }

  .protocol-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
  }

  .protocol-card {
    background: var(--surface-1);
    border: 1px solid var(--border-weak);
    border-radius: var(--radius);
    padding: 20px;
    transition: border-color var(--dur-med) var(--easing-standard);

    &:hover {
      border-color: var(--border-strong);
    }
  }

  .protocol-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .protocol-info {
    display: flex;
    align-items: center;
    gap: 8px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .protocol-icon {
      color: var(--primary);
    }
  }

  .protocol-metrics {
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
