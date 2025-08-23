<script lang="ts">
  import { Badge } from 'flowbite-svelte';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';
  import DetailItem from './Common/DetailItem.svelte';
  import DetailGrid from './Common/DetailGrid.svelte';
  import DetailSection from './Common/DetailSection.svelte';

  type Props = {
    yieldSource: YieldSourceDisplayData;
  };

  let { yieldSource }: Props = $props();
</script>

<div class="lsu-pool-details">
  <DetailSection title="Liquid Staking Information">
    <DetailGrid>
      <DetailItem label="Base Staking APY" value="5.2%" />
      <DetailItem label="Trading Fees APY" value="1.8%" />
      <DetailItem label="Total APY" value={yieldSource.apy + '%'} />
      <DetailItem label="Unstaking Time" value="~7 days" />
      <DetailItem label="NAV Price" value="1.024 XRD" />
      <DetailItem label="Market Price" value="1.021 XRD" />
    </DetailGrid>
  </DetailSection>

  <DetailSection title="Underlying Validators">
    <div class="validator-list">
      <!-- Mock validator data - replace with actual data -->
      <div class="validator-item">
        <div class="validator-info">
          <span class="validator-name">Radix Foundation Node</span>
          <Badge color="green" size="small">99.1% uptime</Badge>
        </div>
        <div class="validator-weight">35%</div>
      </div>
      <div class="validator-item">
        <div class="validator-info">
          <span class="validator-name">StakeHound Validator</span>
          <Badge color="green" size="small">98.7% uptime</Badge>
        </div>
        <div class="validator-weight">25%</div>
      </div>
      <!-- More validators... -->
    </div>
  </DetailSection>

  {#if yieldSource.yieldSubSources}
    <DetailSection title="Yield Sources Breakdown">
      <div class="yield-breakdown">
        {#each yieldSource.yieldSubSources as sub}
          <div class="yield-item">
            <div class="yield-info">
              <span class="yield-type">{sub.type.replace('_', ' ')}</span>
              <span class="yield-desc">{sub.description}</span>
            </div>
            <div class="yield-apy">{sub.apy}%</div>
            <Badge color={sub.isActive ? 'green' : 'gray'} size="small">
              {sub.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        {/each}
      </div>
    </DetailSection>
  {/if}
</div>

<style lang="scss">
  .validator-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .validator-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--surface-1);
    border-radius: 6px;
  }

  .validator-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .validator-name {
    font-weight: 500;
  }

  .validator-weight {
    font-weight: 600;
    color: var(--primary);
  }

  .yield-breakdown {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .yield-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: var(--surface-1);
    border-radius: 6px;
  }

  .yield-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .yield-type {
    font-weight: 500;
    text-transform: capitalize;
  }

  .yield-desc {
    font-size: 12px;
    color: var(--gray-400);
  }

  .yield-apy {
    font-weight: 600;
    color: var(--primary);
  }
</style>
