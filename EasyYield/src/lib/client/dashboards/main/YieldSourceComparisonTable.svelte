<script lang="ts">
  import PaginatedTable from '$client/components/PaginatedTable/PaginatedTable.svelte';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';
  import YieldSourceCell from './YieldSourceCell.svelte';
  
  let { yieldSources }:{ yieldSources: YieldSourceDisplayData[] } = $props()
  console.log(yieldSources)
  const columns = [
    {
      key: 'name' as keyof YieldSourceDisplayData,
      label: 'Yield Source',
      renderComponent: (row: YieldSourceDisplayData) => ({
        component: YieldSourceCell,
        props: { row }
      })
    },
    {
      key: 'apy' as keyof YieldSourceDisplayData,
      label: 'APY',
      render: (row: YieldSourceDisplayData) => `<strong>${row.apy}%</strong>`
    },
    { key: 'tvl' as keyof YieldSourceDisplayData, label: 'TVL' },
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
        return `<span class="status-badge ${row.status}">${badge}</span>`;
      }
    },
    {
      key: 'volatility' as keyof YieldSourceDisplayData,
      label: 'Volatility',
      render: (row: YieldSourceDisplayData) =>
        row.volatility != null ? `${Number(row.volatility).toFixed(2)}%` : '--'
    },
    {
      key: 'id' as keyof YieldSourceDisplayData,
      label: '',
      sortable: false,
      render: (row: YieldSourceDisplayData) =>
        `<a class="action-link" href="/yield-sources/${row.id}">Details</a>`
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
