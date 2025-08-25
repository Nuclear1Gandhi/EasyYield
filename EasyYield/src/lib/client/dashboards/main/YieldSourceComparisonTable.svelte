<script lang="ts">
  import PaginatedTable from '$client/components/PaginatedTable/PaginatedTable.svelte';
  import { formatLargeNumber } from '$client/utils/format';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';
  import StartEarningButton from '$client/components/StartEarningButton/StartEarningButton.svelte';
  import YieldSourceCell from './YieldSourceCell.svelte';
  import YieldSourceExpanded from './YieldSourceTableRow/Expanded/YieldSourceExpanded.svelte';
  import Empty from './Empty.svelte';
  
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
      key: 'change24h' as keyof YieldSourceDisplayData,
      label: '24h Δ',
      render: (row: YieldSourceDisplayData) => {
        const change = row.change24h ?? '0';
        const cls = change.startsWith('+') ? 'pos' : change.startsWith('-') ? 'neg' : '';
        return `<span class="${cls}">${change}%</span>`;
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
    },
  ];

  function renderExpandedRow(yieldSource: YieldSourceDisplayData) {
    return {
      component: YieldSourceExpanded,
      props: { yieldSource }
    };
  }

  function getYieldSourceId(yieldSource: YieldSourceDisplayData): string {
    return yieldSource.id;
  }

  function getRowClass(item: YieldSourceDisplayData, index: number): string {
    return '';
  }

  let isRefreshing = $state(false);
  let refreshError = $state<string | null>(null);

  async function refreshYieldData() {
    isRefreshing = true;
    refreshError = null;
    try {
      const response = await fetch('/api/v1/protected/yield-sources', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-cache'
      });
      if (!response.ok) throw new Error(`Failed to fetch yield sources: ${response.status}`);
      const freshData: YieldSourceDisplayData[] = await response.json();
      yieldSources = freshData;
    } catch (error) {
      refreshError = error instanceof Error ? error.message : 'Unknown error occurred';
    } finally {
      isRefreshing = false;
    }
  }
</script>

<PaginatedTable
  data={yieldSources}
  {columns}
  syncWithUrl
  title="Available Yield Opportunities"
  itemName="yield sources"
  pageSize={25}
  expandable
  expandedRowRender={renderExpandedRow}
  getRowId={getYieldSourceId}
  rowClass={getRowClass}
>
  {#snippet empty()}
    <Empty 
      title="No Yield Opportunities Found"
      description=""
      actionText={isRefreshing ? "Refreshing..." : "Refresh Yields"}
      onAction={refreshYieldData}
      icon="tabler:coin-off"
      loading={isRefreshing}
    />
  {/snippet}
</PaginatedTable>

{#if refreshError}
  <div class="refresh-error">
    <p>Failed to refresh data: {refreshError}</p>
    <button onclick={() => refreshError = null}>Dismiss</button>
  </div>
{/if}

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
