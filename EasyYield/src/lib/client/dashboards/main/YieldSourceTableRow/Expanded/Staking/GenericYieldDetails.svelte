<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Badge } from 'flowbite-svelte';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';
  import DetailSection from '../Common/DetailSection.svelte';
  import DetailGrid from '../Common/DetailGrid.svelte';
  import DetailItem from '../Common/DetailItem.svelte';

  type Props = {
    yieldSource: YieldSourceDisplayData;
  };

  let { yieldSource }: Props = $props();

  function getTypeDescription(type: string): string {
    switch (type) {
      case 'LENDING_POOL':
        return 'Earn yield by providing liquidity to lending protocols';
      case 'FARMING':
        return 'Earn rewards through liquidity mining programs';
      case 'STAKING_DERIVATIVE':
        return 'Staked token derivatives with additional yield opportunities';
      default:
        return 'Decentralized finance yield opportunity';
    }
  }
</script>

<div class="generic-yield-details">
  <DetailSection title="Yield Source Information">
    <DetailGrid>
      <DetailItem
        label="Protocol" 
        value={yieldSource.protocolName || 'Unknown'} 
      />
      <DetailItem 
        label="Type" 
        value={yieldSource.type.replace('_', ' ')}
      />
      <DetailItem 
        label="Current APY" 
        value="{yieldSource.apy}%" 
        highlight={true}
      />
      <DetailItem 
        label="Total Value Locked" 
        value={yieldSource.tvl} 
      />
      <DetailItem 
        label="7-Day Average APY" 
        value="{yieldSource.apy7dAvg || 'N/A'}%" 
      />
      <DetailItem 
        label="Last Updated" 
        value={new Date(yieldSource.lastUpdated).toLocaleDateString()}
      />
    </DetailGrid>
  </DetailSection>

  <DetailSection title="Description">
    <div class="description-content">
      <p>{getTypeDescription(yieldSource.type)}</p>
      {#if yieldSource.tokenSymbols && yieldSource.tokenSymbols.length > 0}
        <div class="token-info">
          <span class="token-label">Supported Tokens:</span>
          <div class="token-list">
            {#each yieldSource.tokenSymbols as token}
              <Badge color="blue" size="small">{token}</Badge>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </DetailSection>

  {#if yieldSource.isComposite && yieldSource.yieldSubSources}
    <DetailSection title="Yield Components">
      <div class="yield-sources">
        {#each yieldSource.yieldSubSources as subSource}
          <div class="yield-source-item">
            <div class="yield-header">
              <Icon icon="tabler:chart-line" width="16" />
              <span class="yield-type">{subSource.type.replace('_', ' ')}</span>
              <span class="yield-apy">{subSource.apy}%</span>
              <Badge color={subSource.isActive ? 'green' : 'gray'} size="small">
                {subSource.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p class="yield-description">{subSource.description || 'No description available'}</p>
            <div class="yield-meta">
              <span class="risk-label">Risk Level:</span>
              <Badge color={subSource.risk === 'low' ? 'green' : subSource.risk === 'medium' ? 'yellow' : 'red'} size="small">
                {subSource.risk}
              </Badge>
            </div>
          </div>
        {/each}
      </div>
    </DetailSection>
  {/if}

  <DetailSection title="Risk Information">
    <div class="risk-breakdown">
      <div class="risk-item {yieldSource.riskProfile || 'medium'}">
        <Icon icon="tabler:shield" width="16" />
        <div class="risk-content">
          <span class="risk-label">Overall Risk Level</span>
          <span class="risk-value">{yieldSource.riskProfile || 'Medium'}</span>
          <span class="risk-desc">Based on protocol analysis and yield structure</span>
        </div>
      </div>

      <div class="risk-item low">
        <Icon icon="tabler:building-bank" width="16" />
        <div class="risk-content">
          <span class="risk-label">Protocol Risk</span>
          <span class="risk-value">Established DeFi protocol</span>
          <span class="risk-desc">Track record and community trust</span>
        </div>
      </div>

      <div class="risk-item medium">
        <Icon icon="tabler:code" width="16" />
        <div class="risk-content">
          <span class="risk-label">Smart Contract Risk</span>
          <span class="risk-value">Standard DeFi risks apply</span>
          <span class="risk-desc">Code complexity and audit status unknown</span>
        </div>
      </div>
    </div>
  </DetailSection>

  <DetailSection title="Performance">
    <div class="performance-grid">
      <div class="performance-item">
        <Icon icon="tabler:trending-up" width="20" />
        <div>
          <span class="perf-label">Status</span>
          <span class="perf-value status-{yieldSource.status}">{yieldSource.status}</span>
        </div>
      </div>
      
      {#if yieldSource.change}
        <div class="performance-item">
          <Icon icon="tabler:percentage" width="20" />
          <div>
            <span class="perf-label">7-Day Change</span>
            <span class="perf-value {parseFloat(yieldSource.change) >= 0 ? 'positive' : 'negative'}">
              {yieldSource.change}%
            </span>
          </div>
        </div>
      {/if}

      {#if yieldSource.volatility}
        <div class="performance-item">
          <Icon icon="tabler:activity" width="20" />
          <div>
            <span class="perf-label">Volatility</span>
            <span class="perf-value">{yieldSource.volatility.toFixed(2)}%</span>
          </div>
        </div>
      {/if}
    </div>
  </DetailSection>

  <DetailSection title="Actions">
    <div class="action-buttons">
      <button class="action-btn primary">
        <Icon icon="tabler:external-link" width="16" />
        View Protocol
      </button>
      <button class="action-btn secondary">
        <Icon icon="tabler:chart-bar" width="16" />
        View Analytics
      </button>
      <button class="action-btn secondary">
        <Icon icon="tabler:info-circle" width="16" />
        More Details
      </button>
    </div>
  </DetailSection>
</div>

<style lang="scss">
  .generic-yield-details {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .description-content {
    p {
      margin: 0 0 12px 0;
      color: var(--gray-300);
      line-height: 1.5;
    }
  }

  .token-info {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .token-label {
    font-weight: 500;
    color: var(--fg);
  }

  .token-list {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }

  .yield-sources {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .yield-source-item {
    padding: 16px;
    background: var(--surface-1);
    border-radius: 8px;
    border: 1px solid var(--border-weak);
  }

  .yield-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .yield-type {
    font-weight: 500;
    text-transform: capitalize;
    flex: 1;
  }

  .yield-apy {
    font-weight: 600;
    color: var(--primary);
  }

  .yield-description {
    font-size: 14px;
    color: var(--gray-400);
    margin: 0 0 8px 0;
    line-height: 1.4;
  }

  .yield-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .risk-label {
    font-size: 12px;
    color: var(--gray-500);
  }

  .risk-breakdown {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .risk-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    border-left: 3px solid;

    &.low {
      background: var(--green-50);
      border-color: var(--green-500);
    }

    &.medium {
      background: var(--yellow-50);
      border-color: var(--yellow-500);
    }

    &.high {
      background: var(--red-50);
      border-color: var(--red-500);
    }
  }

  .risk-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .performance-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
  }

  .performance-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--surface-1);
    border-radius: 6px;
  }

  .perf-label {
    display: block;
    font-size: 12px;
    color: var(--gray-400);
    font-weight: 500;
  }

  .perf-value {
    display: block;
    font-size: 14px;
    font-weight: 600;

    &.positive {
      color: var(--green-500);
    }

    &.negative {
      color: var(--red-500);
    }

    &.status-growing {
      color: var(--green-500);
    }

    &.status-stable {
      color: var(--blue-500);
    }

    &.status-volatile {
      color: var(--yellow-500);
    }
  }

  .action-buttons {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .action-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border-radius: 6px;
    border: none;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;

    &.primary {
      background: var(--primary);
      color: white;

      &:hover {
        background: var(--primary-600);
      }
    }

    &.secondary {
      background: var(--surface-3);
      color: var(--fg);
      border: 1px solid var(--border-weak);

      &:hover {
        background: var(--surface-1);
      }
    }
  }
</style>
 