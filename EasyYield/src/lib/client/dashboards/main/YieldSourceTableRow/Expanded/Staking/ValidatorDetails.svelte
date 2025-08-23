<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';
  import DetailSection from '../Common/DetailSection.svelte';
  import DetailGrid from '../Common/DetailGrid.svelte';
  import DetailItem from '../Common/DetailItem.svelte';

  type Props = {
    yieldSource: YieldSourceDisplayData;
  };

  let { yieldSource }: Props = $props();

  // Extract validator-specific data from raw
  let validatorData = $derived(yieldSource.raw);
  
  function getUptimeColor(uptime: string): string {
    const uptimeNum = parseFloat(uptime);
    if (uptimeNum >= 99) return 'green';
    if (uptimeNum >= 95) return 'yellow';
    return 'red';
  }

  function getFeeColor(fee: string): string {
    const feeNum = parseFloat(fee);
    if (feeNum <= 2) return 'green';
    if (feeNum <= 5) return 'yellow';
    return 'red';
  }
</script>

<div class="validator-details">
  <DetailSection title="Validator Performance">
    <DetailGrid>
      <DetailItem
        --detail-color={getFeeColor(validatorData?.fee)} 
        label="Validator Fee" 
        value="{validatorData?.fee || 'N/A'}%" 
      />
      <DetailItem 
        label="Current APY" 
        value="{yieldSource.apy}%" 
        highlight={true}
      />
      <DetailItem 
        --detail-color={getUptimeColor(validatorData?.uptime)}
        label="Uptime (30d)" 
        value="{validatorData?.uptime || 'N/A'}%" 
      />
      <DetailItem 
        label="Total Delegated Stake" 
        value="{yieldSource.tvl}" 
      />
      <DetailItem 
        label="Your Stake" 
        value="0 XRD" 
      />
      <DetailItem 
        label="Minimum Stake" 
        value="10 XRD" 
      />
    </DetailGrid>
  </DetailSection>

  <DetailSection title="Validator Information">
    <div class="validator-info">
      <div class="info-item">
        <Icon icon="tabler:user" width="16" />
        <div>
          <span class="info-label">Validator Name</span>
          <span class="info-value">{yieldSource.name}</span>
        </div>
      </div>
      <div class="info-item">
        <Icon icon="tabler:clock" width="16" />
        <div>
          <span class="info-label">Active Since</span>
          <span class="info-value">{validatorData?.activeSince || 'Unknown'}</span>
        </div>
      </div>
      <div class="info-item">
        <Icon icon="tabler:map-pin" width="16" />
        <div>
          <span class="info-label">Location</span>
          <span class="info-value">{validatorData?.location || 'Not specified'}</span>
        </div>
      </div>
    </div>
  </DetailSection>

  <DetailSection title="Risk Assessment">
    <div class="risk-breakdown">
      <div class="risk-item {validatorData?.slashingEvents === 0 ? 'low' : 'high'}">
        <Icon icon="tabler:shield" width="16" />
        <div class="risk-content">
          <span class="risk-label">Slashing Risk</span>
          <span class="risk-value">
            {validatorData?.slashingEvents === 0 ? 'No slashing events' : `${validatorData?.slashingEvents || 0} events`}
          </span>
          <span class="risk-desc">Historical slashing events (365d)</span>
        </div>
      </div>
      
      <div class="risk-item {parseFloat(validatorData?.uptime || '0') >= 99 ? 'low' : 'medium'}">
        <Icon icon="tabler:activity" width="16" />
        <div class="risk-content">
          <span class="risk-label">Uptime Risk</span>
          <span class="risk-value">
            {parseFloat(validatorData?.uptime || '0') >= 99 ? 'Excellent' : 'Moderate'}
          </span>
          <span class="risk-desc">{validatorData?.uptime || 'N/A'}% uptime last 30 days</span>
        </div>
      </div>

      <div class="risk-item medium">
        <Icon icon="tabler:alert-triangle" width="16" />
        <div class="risk-content">
          <span class="risk-label">Concentration Risk</span>
          <span class="risk-value">Single validator</span>
          <span class="risk-desc">No diversification across validators</span>
        </div>
      </div>
    </div>
  </DetailSection>

  <DetailSection title="Staking Details">
    <div class="staking-info">
      <div class="staking-item">
        <Icon icon="tabler:lock" width="16" />
        <div>
          <span class="staking-label">Lock Period</span>
          <span class="staking-value">Flexible (can unstake anytime)</span>
        </div>
      </div>
      <div class="staking-item">
        <Icon icon="tabler:clock" width="16" />
        <div>
          <span class="staking-label">Unstaking Time</span>
          <span class="staking-value">~21 days (protocol unbonding)</span>
        </div>
      </div>
      <div class="staking-item">
        <Icon icon="tabler:coins" width="16" />
        <div>
          <span class="staking-label">Reward Frequency</span>
          <span class="staking-value">Every epoch (~5 minutes)</span>
        </div>
      </div>
    </div>
  </DetailSection>

  <DetailSection title="Actions">
    <div class="action-buttons">
      <button class="action-btn primary">
        <Icon icon="tabler:external-link" width="16" />
        View on RadixScan
      </button>
      <button class="action-btn secondary">
        <Icon icon="tabler:chart-line" width="16" />
        Reward History
      </button>
      <button class="action-btn secondary">
        <Icon icon="tabler:info-circle" width="16" />
        Validator Details
      </button>
    </div>
  </DetailSection>
</div>

<style lang="scss">
  .validator-details {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .validator-info,
  .staking-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .info-item,
  .staking-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: var(--surface-1);
    border-radius: 6px;
  }

  .info-label,
  .staking-label {
    display: block;
    font-size: 12px;
    color: var(--gray-400);
    font-weight: 500;
  }

  .info-value,
  .staking-value {
    display: block;
    font-size: 14px;
    color: var(--fg);
    font-weight: 500;
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
