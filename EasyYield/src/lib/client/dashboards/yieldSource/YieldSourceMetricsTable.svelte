<!-- src/client/components/YieldSourceDetail/YieldSourceMetricsTable.svelte -->
<script lang="ts">
  import { Card, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
  import { formatLargeNumber, formatRelativeTime } from '$client/utils/format';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';

  let { yieldSource }: { yieldSource: YieldSourceDisplayData } = $props();

  const metrics = [
    {
      label: 'Current APY',
      value: `${yieldSource.apy}%`,
      type: 'primary'
    },
    {
      label: '7-Day Avg APY',
      value: yieldSource.apy7dAvg ? `${yieldSource.apy7dAvg}%` : '--',
      type: 'normal'
    },
    {
      label: '7-Day APY Std Dev',
      value: yieldSource.apyStd7d ? `${yieldSource.apyStd7d}%` : '--',
      type: 'normal'
    },
    {
      label: 'TVL',
      value: formatLargeNumber(yieldSource.tvl),
      type: 'normal'
    },
    {
      label: '7-Day TVL Change',
      value: yieldSource.tvlChange7d ? `${yieldSource.tvlChange7d}%` : '--',
      type: yieldSource.tvlChange7d?.startsWith('+') ? 'positive' : 
            yieldSource.tvlChange7d?.startsWith('-') ? 'negative' : 'normal'
    },
    {
      label: 'Status',
      value: yieldSource.status.charAt(0).toUpperCase() + yieldSource.status.slice(1),
      type: 'badge'
    },
    {
      label: 'Volatility',
      value: yieldSource.volatility != null ? `${Number(yieldSource.volatility).toFixed(2)}%` : '--',
      type: 'normal'
    },
    {
      label: 'Last Updated',
      value: formatRelativeTime(yieldSource.lastUpdated),
      type: 'normal'
    }
  ];
</script>

<Card>
  <div class="metrics-header">
    <h3>Detailed Metrics</h3>
  </div>
  
  <Table>
    <TableHead>
      <TableHeadCell>Metric</TableHeadCell>
      <TableHeadCell>Value</TableHeadCell>
    </TableHead>
    <TableBody>
      {#each metrics as metric}
        <TableBodyRow>
          <TableBodyCell class="metric-label">{metric.label}</TableBodyCell>
          <TableBodyCell>
            <span class="metric-value {metric.type}">
              {metric.value}
            </span>
          </TableBodyCell>
        </TableBodyRow>
      {/each}
    </TableBody>
  </Table>
</Card>

<style lang="scss">
  .metrics-header {
    margin-bottom: 16px;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      color: var(--text-primary);
    }
  }

  :global(.metric-label) {
    font-weight: 500;
    color: var(--text-secondary);
  }

  :global(.metric-value) {
    font-weight: 600;
    
    &.primary {
      color: var(--primary);
      font-size: 16px;
    }
    
    &.positive {
      color: var(--success);
    }
    
    &.negative {
      color: var(--error);
    }
    
    &.badge {
      background: var(--surface-2);
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      text-transform: uppercase;
    }
  }
</style>
