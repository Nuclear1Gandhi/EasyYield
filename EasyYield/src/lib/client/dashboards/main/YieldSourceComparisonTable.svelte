<script lang="ts">
  import PaginatedTable from '$client/components/PaginatedTable/PaginatedTable.svelte';
  import { formatLargeNumber } from '$client/utils/format';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';
  import YieldSourceCell from './YieldSourceCell.svelte';
  import StartEarningButton from '$client/components/StartEarningButton/StartEarningButton.svelte';
  
  let { yieldSources }: { yieldSources: YieldSourceDisplayData[] } = $props();

  const columns = [
    {
      key: 'name' as keyof YieldSourceDisplayData,
      label: 'Yield Source',
      render: (row: YieldSourceDisplayData) => ({
        component: YieldSourceCell,
        props: { row }
      })
    },
    {
      key: 'apy' as keyof YieldSourceDisplayData,
      label: 'APY',
      render: (row: YieldSourceDisplayData) => `<strong>${row.apy}%</strong>`
    },
    { 
      key: 'tvl' as keyof YieldSourceDisplayData, 
      label: 'TVL', 
      render: (row: YieldSourceDisplayData) => `<span>${formatLargeNumber(row.tvl)}</span>`
    },
    {
      key: 'change' as keyof YieldSourceDisplayData,
      label: '7d Δ',
      render: (row: YieldSourceDisplayData) => {
        const cls = row.change?.startsWith('+') ? 'pos' : row.change?.startsWith('-') ? 'neg' : '';
        return `<span class="${cls}">${row.change}%</span>`;
      }
    },
    {
      key: 'status' as keyof YieldSourceDisplayData,
      label: 'Status',
      render: (row: YieldSourceDisplayData) => {
        const badge = row.status?.charAt(0).toUpperCase() + row.status?.slice(1);
        const colorClass = row.status === 'growing' ? 'growing' : 
                          row.status === 'stable' ? 'stable' : 'volatile';
        return `<span class="status-badge ${colorClass}">${badge}</span>`;
      }
    },
    {
      key: 'id' as keyof YieldSourceDisplayData,
      label: '',
      sortable: false,
      render: (row: YieldSourceDisplayData) => ({
        component: StartEarningButton,
        props: { 
          source: row, 
        }
      })
    }
  ];
</script>

<PaginatedTable
  data={yieldSources}
  {columns}
  syncWithUrl
  title="Available Yield Opportunities"
  itemName="yield sources"
  pageSize={25}
/>

<style lang="scss">
  :global(.pos) { color: var(--success); }
  :global(.neg) { color: var(--error); }
  
  :global(.status-badge) {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    text-transform: uppercase;
    font-weight: 600;
    
    &.growing {
      background: rgba(34, 197, 94, 0.1);
      color: rgb(34, 197, 94);
    }
    
    &.stable {
      background: rgba(59, 130, 246, 0.1);
      color: rgb(59, 130, 246);
    }
    
    &.volatile {
      background: rgba(245, 158, 11, 0.1);
      color: rgb(245, 158, 11);
    }
  }
</style>
