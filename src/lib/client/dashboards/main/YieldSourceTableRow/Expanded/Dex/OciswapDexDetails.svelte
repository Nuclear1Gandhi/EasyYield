<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Badge } from 'flowbite-svelte';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';
  import DetailItem from '../Common/DetailItem.svelte';
  import DetailGrid from '../Common/DetailGrid.svelte';
  import DetailSection from '../Common/DetailSection.svelte';

  type Props = {
    yieldSource: YieldSourceDisplayData;
  };

  let { yieldSource }: Props = $props();

  // Extract Ociswap-specific data from raw
  let poolData = $derived(yieldSource.raw as any);

  function getPoolRatio(): string {
    // Default to 50/50 for Ociswap pools unless specified
    return poolData?.ratio || '50/50';
  }

  function estimateSlippage(): string {
    const tvlNum = parseFloat(yieldSource.tvl.replace(/[^\d.]/g, ''));
    if (tvlNum > 5000000) return '< 0.1%';
    if (tvlNum > 1000000) return '< 0.5%';
    return '< 2.0%';
  }
</script>

<div class="ociswap-dex-details">
  <DetailSection title="Ociswap Pool Information">
    <DetailGrid>
      <DetailItem label="Pool Type" value="Constant Product (x*y=k)" />
      <DetailItem label="Fee Tier" value="0.25%" />
      <DetailItem label="Pool Ratio" value={getPoolRatio()} />
      <DetailItem label="24h Volume" value={yieldSource.volume7d || 'N/A'} />
      <DetailItem label="Liquidity Utilization" value="67%" />
      <DetailItem label="Pool Created" value={poolData?.createdAt ? new Date(poolData.createdAt).toLocaleDateString() : 'N/A'} />
    </DetailGrid>
  </DetailSection>

  <DetailSection title="Ociswap Features">
    <div class="feature-list">
      <div class="feature-item">
        <Icon icon="tabler:rocket" width="16" />
        <span>Flash swaps</span>
        <Badge color="green" size="small">Available</Badge>
      </div>
      <div class="feature-item">
        <Icon icon="tabler:shield" width="16" />
        <span>Slippage protection</span>
        <Badge color="blue" size="small">Enabled</Badge>
      </div>
      <div class="feature-item">
        <Icon icon="tabler:zap" width="16" />
        <span>Instant swaps</span>
        <Badge color="purple" size="small">Standard</Badge>
      </div>
      <div class="feature-item">
        <Icon icon="tabler:arrows-exchange" width="16" />
        <span>Multi-hop routing</span>
        <Badge color="indigo" size="small">Optimized</Badge>
      </div>
    </div>
  </DetailSection>

  <DetailSection title="Trading Information">
    <DetailGrid>
      <DetailItem label="Current Price" value={poolData?.currentPrice || 'N/A'} />
      <DetailItem label="Price Impact" value={estimateSlippage()} />
      <DetailItem label="24h Price Change" value={poolData?.priceChange24h || 'N/A'} />
      <DetailItem label="All-time High" value={poolData?.allTimeHigh || 'N/A'} />
      <DetailItem label="All-time Low" value={poolData?.allTimeLow || 'N/A'} />
      <DetailItem label="Market Cap" value={poolData?.marketCap || 'N/A'} />
    </DetailGrid>
  </DetailSection>

  <DetailSection title="Liquidity Analysis">
    <div class="liquidity-info">
      <div class="liquidity-metric">
        <Icon icon="tabler:droplet" width="20" />
        <div>
          <span class="metric-label">Total Liquidity</span>
          <span class="metric-value">{yieldSource.tvl}</span>
        </div>
      </div>
      <div class="liquidity-metric">
        <Icon icon="tabler:users" width="20" />
        <div>
          <span class="metric-label">Liquidity Providers</span>
          <span class="metric-value">{poolData?.liquidityProviders || 'N/A'}</span>
        </div>
      </div>
      <div class="liquidity-metric">
        <Icon icon="tabler:chart-line" width="20" />
        <div>
          <span class="metric-label">Liquidity Depth</span>
          <span class="metric-value">{poolData?.liquidityDepth || 'Deep'}</span>
        </div>
      </div>
    </div>
  </DetailSection>

  <DetailSection title="Risk Assessment">
    <div class="risk-breakdown">
      <div class="risk-item low">
        <Icon icon="tabler:trending-down" width="16" />
        <div class="risk-content">
          <span class="risk-label">Impermanent Loss Risk</span>
          <span class="risk-value">Low-Medium (~1.8%)</span>
          <span class="risk-desc">Based on token correlation and volatility</span>
        </div>
      </div>
      
      <div class="risk-item low">
        <Icon icon="tabler:shield-check" width="16" />
        <div class="risk-content">
          <span class="risk-label">Smart Contract Risk</span>
          <span class="risk-value">Low</span>
          <span class="risk-desc">Audited AMM protocol with proven track record</span>
        </div>
      </div>

      <div class="risk-item medium">
        <Icon icon="tabler:clock" width="16" />
        <div class="risk-content">
          <span class="risk-label">Market Risk</span>
          <span class="risk-value">Medium</span>
          <span class="risk-desc">Standard market volatility applies</span>
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
              <Icon icon="tabler:coin" width="16" />
              <span class="yield-type">{subSource.type.replace('_', ' ')}</span>
              <span class="yield-apy">{subSource.apy}%</span>
              <Badge color={subSource.isActive ? 'green' : 'gray'} size="small">
                {subSource.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p class="yield-description">{subSource.description || 'Ociswap liquidity provision rewards'}</p>
          </div>
        {/each}
      </div>
    </DetailSection>
  {:else}
    <DetailSection title="Yield Information">
      <div class="single-yield">
        <div class="yield-breakdown-simple">
          <div class="yield-main">
            <Icon icon="tabler:percentage" width="24" />
            <div>
              <span class="yield-label">Trading Fee Rewards</span>
              <span class="yield-value">{yieldSource.apy}% APY</span>
              <span class="yield-desc">Earn 0.25% of all trading volume in this pool</span>
            </div>
          </div>
          <div class="yield-details">
            <div class="yield-detail-item">
              <span class="detail-label">Fee Structure:</span>
              <span class="detail-value">0.25% per swap</span>
            </div>
            <div class="yield-detail-item">
              <span class="detail-label">Your Share:</span>
              <span class="detail-value">Proportional to LP tokens</span>
            </div>
            <div class="yield-detail-item">
              <span class="detail-label">Compound Frequency:</span>
              <span class="detail-value">On each trade</span>
            </div>
          </div>
        </div>
      </div>
    </DetailSection>
  {/if}

  <DetailSection title="Pool Statistics">
    <DetailGrid>
      <DetailItem label="Total Swaps" value={poolData?.totalSwaps || 'N/A'} />
      <DetailItem label="Avg Daily Volume" value={poolData?.avgDailyVolume || 'N/A'} />
      <DetailItem label="Peak Volume (24h)" value={poolData?.peakVolume24h || 'N/A'} />
      <DetailItem label="LP Token Supply" value={poolData?.lpTokenSupply || 'N/A'} />
      <DetailItem label="Swap Count (24h)" value={poolData?.swapCount24h || 'N/A'} />
      <DetailItem label="Unique Traders" value={poolData?.uniqueTraders || 'N/A'} />
    </DetailGrid>
  </DetailSection>

  <DetailSection title="Actions">
    <div class="action-buttons">
      <button class="action-btn primary">
        <Icon icon="tabler:external-link" width="16" />
        Trade on Ociswap
      </button>
      <button class="action-btn secondary">
        <Icon icon="tabler:plus" width="16" />
        Add Liquidity
      </button>
      <button class="action-btn secondary">
        <Icon icon="tabler:chart-bar" width="16" />
        Pool Analytics
      </button>
      <button class="action-btn secondary">
        <Icon icon="tabler:history" width="16" />
        Transaction History
      </button>
    </div>
  </DetailSection>
</div>

<style lang="scss">
  .ociswap-dex-details {
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

  .liquidity-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .liquidity-metric {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--surface-1);
    border-radius: 8px;
    border: 1px solid var(--border-weak);
  }

  .metric-label {
    display: block;
    font-size: 12px;
    color: var(--gray-400);
    font-weight: 500;
  }

  .metric-value {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: var(--fg);
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
    gap: 8px;
    margin-bottom: 6px;
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
    margin: 0;
  }

  .single-yield {
    background: var(--surface-1);
    border-radius: 8px;
    padding: 20px;
  }

  .yield-breakdown-simple {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .yield-main {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .yield-label {
    display: block;
    font-weight: 600;
    color: var(--fg);
    font-size: 16px;
  }

  .yield-value {
    display: block;
    font-size: 24px;
    font-weight: 700;
    color: var(--primary);
    margin-top: 4px;
  }

  .yield-desc {
    display: block;
    font-size: 14px;
    color: var(--gray-400);
    margin-top: 4px;
  }

  .yield-details {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    background: var(--surface-2);
    border-radius: 6px;
  }

  .yield-detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-label {
    font-size: 13px;
    color: var(--gray-400);
  }

  .detail-value {
    font-size: 13px;
    font-weight: 500;
    color: var(--fg);
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
