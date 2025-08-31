<script lang="ts">
  import { Badge, Card } from 'flowbite-svelte';
  import { formatLargeNumber } from '$client/utils/format';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';

  let { yieldSource }: { yieldSource: YieldSourceDisplayData } = $props();

  function getStatusColor(status: string) {
    switch (status) {
      case 'growing': return 'green';
      case 'stable': return 'blue';
      case 'volatile': return 'yellow';
      default: return 'gray';
    }
  }

  function getChangeColor(change: string) {
    if (change?.startsWith('+')) return 'text-green-600';
    if (change?.startsWith('-')) return 'text-red-600';
    return 'text-gray-600';
  }
</script>

<Card class="yield-source-header">
  <div class="header-content">
    <!-- Icon and Title -->
    <div class="title-section">
      <div class="icon-group">
        {#if yieldSource.dappIcon}
          <img src={yieldSource.dappIcon} alt={yieldSource.dappName} class="dapp-icon" />
        {/if}
        <div class="token-icons">
          {#each yieldSource.tokenIcons as icon, i}
            <img src={icon} alt={yieldSource.tokenSymbols[i]} class="token-icon" />
          {/each}
        </div>
      </div>
      <div class="title-info">
        <h1>{yieldSource.displayName || yieldSource.name}</h1>
        <p class="protocol-name">{yieldSource.dappName} • {yieldSource.type.toUpperCase()}</p>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-grid">
      <div class="metric">
        <span class="metric-label">Current APY</span>
        <span class="metric-value primary">{yieldSource.apy}%</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">7-Day Average</span>
        <span class="metric-value">{yieldSource.apy7dAvg || '--'}%</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">TVL</span>
        <span class="metric-value">{formatLargeNumber(yieldSource.tvl)}</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">7-Day Change</span>
        <span class="metric-value {getChangeColor(yieldSource.change)}">{yieldSource.change}%</span>
      </div>
    </div>

    <!-- Status Badge -->
    <div class="status-section">
      <Badge color={getStatusColor(yieldSource.status)} large>
        {yieldSource.status.charAt(0).toUpperCase() + yieldSource.status.slice(1)}
      </Badge>
    </div>
  </div>
</Card>

<style lang="scss">
  :global(.yield-source-header) {
    border: 2px solid var(--border-weak);
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .title-section {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .icon-group {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .dapp-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
    }
    
    .token-icons {
      display: flex;
      gap: 4px;
      
      .token-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid white;
        
        &:not(:first-child) {
          margin-left: -8px;
        }
      }
    }
  }

  .title-info {
    h1 {
      font-size: 28px;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: var(--text-primary);
    }
    
    .protocol-name {
      color: var(--text-secondary);
      font-size: 14px;
      margin: 0;
    }
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
  }

  .metric {
    display: flex;
    flex-direction: column;
    gap: 4px;
    
    .metric-label {
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 600;
    }
    
    .metric-value {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-primary);
      
      &.primary {
        font-size: 24px;
        color: var(--primary);
      }
    }
  }

  .status-section {
    display: flex;
    justify-content: flex-start;
  }
</style>
