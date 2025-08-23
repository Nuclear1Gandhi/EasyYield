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

  // Extract CaviarNine-specific data from raw
  let poolData = $derived(yieldSource.raw as any);
  let feeVaultData = $derived(poolData?.feeVaultData);
</script>

<div class="caviarnine-dex-details">
  <DetailSection title="CaviarNine Pool Information">
    <DetailGrid>
      <DetailItem 
        label="Pool Ratio" 
        value={`50/50 ${yieldSource.tokenSymbols?.join(':') || 'N/A'}`} 
      />
      <DetailItem
        label="Fee Tier" 
        value="0.30%" 
      />
      <DetailItem
        label="24h Volume" 
        value={poolData?.volume24h || 'N/A'} 
      />
      <DetailItem 
        label="7d Volume" 
        value={yieldSource.volume7d || 'N/A'} 
      />
      <DetailItem 
        label="Total Fees Earned" 
        value={feeVaultData?.totalFees || 'N/A'} 
      />
      <DetailItem 
        label="Pool Created" 
        value={poolData?.createdAt ? new Date(poolData.createdAt).toLocaleDateString() : 'N/A'} 
      />
    </DetailGrid>
  </DetailSection>

  <DetailSection title="Shape Liquidity Features">
    <div class="feature-list">
      <div class="feature-item">
        <Icon icon="tabler:chart-line" width="16" />
        <span>Dynamic fee adjustment</span>
        <Badge color="green" size="small">Active</Badge>
      </div>
      <div class="feature-item">
        <Icon icon="tabler:shield-check" width="16" />
        <span>MEV protection</span>
        <Badge color="blue" size="small">Enabled</Badge>
      </div>
      <div class="feature-item">
        <Icon icon="tabler:coins" width="16" />
        <span>Concentrated liquidity</span>
        <Badge color="purple" size="small">Available</Badge>
      </div>
    </div>
  </DetailSection>

  <DetailSection title="Risk Analysis">
    <div class="risk-breakdown">
      <div class="risk-item low">
        <Icon icon="tabler:trending-down" width="16" />
        <div class="risk-content">
          <span class="risk-label">Impermanent Loss Risk</span>
          <span class="risk-value">Low (~1.2% recent)</span>
          <span class="risk-desc">Based on 30d price correlation</span>
        </div>
      </div>
      <div class="risk-item low">
        <Icon icon="tabler:shield" width="16" />
        <div class="risk-content">
          <span class="risk-label">Smart Contract Risk</span>
          <span class="risk-value">Low</span>
          <span class="risk-desc">Audited by Halborn Security</span>
        </div>
      </div>
      <div class="risk-item medium">
        <Icon icon="tabler:graph" width="16" />
        <div class="risk-content">
          <span class="risk-label">Liquidity Risk</span>
          <span class="risk-value">Medium</span>
          <span class="risk-desc">Moderate pool depth</span>
        </div>
      </div>
    </div>
  </DetailSection>

  {#if yieldSource.isComposite && yieldSource.yieldSubSources}
    <DetailSection title="Yield Breakdown">
      <div class="yield-sources">
        {#each yieldSource.yieldSubSources as subSource}
          <div class="yield-source-item">
            <div class="yield-header">
              <span class="yield-type">{subSource.type.replace('_', ' ')}</span>
              <span class="yield-apy">{subSource.apy}%</span>
              <Badge color={subSource.isActive ? 'green' : 'gray'} size="small">
                {subSource.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p class="yield-description">{subSource.description}</p>
          </div>
        {/each}
      </div>
    </DetailSection>
  {/if}

  <DetailSection title="Actions">
    <div class="action-buttons">
      <button class="action-btn primary">
        <Icon icon="tabler:external-link" width="16" />
        Open in CaviarNine
      </button>
      <!-- <button class="action-btn secondary">
        <Icon icon="tabler:chart-bar" width="16" />
        View Analytics
      </button> -->
      <!-- <button class="action-btn secondary">
        <Icon icon="tabler:history" width="16" />
        Price History
      </button> -->
    </div>
  </DetailSection>
</div>

<style lang="scss">
  .caviarnine-dex-details {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: var(--surface-1);
    border-radius: 6px;
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

  .risk-label {
    font-weight: 500;
    color: var(--fg);
  }

  .risk-value {
    font-size: 14px;
    color: var(--gray-600);
  }

  .risk-desc {
    font-size: 12px;
    color: var(--gray-500);
  }

  .yield-sources {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .yield-source-item {
    padding: 12px;
    background: var(--surface-1);
    border-radius: 8px;
  }

  .yield-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 6px;
  }

  .yield-type {
    font-weight: 500;
    text-transform: capitalize;
  }

  .yield-apy {
    font-weight: 600;
    color: var(--primary);
  }

  .yield-description {
    font-size: 14px;
    color: var(--gray-400);
    margin: 0;
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
