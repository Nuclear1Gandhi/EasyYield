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
    },
  ];

  // Function to render the expanded row content
  function renderExpandedRow(yieldSource: YieldSourceDisplayData) {
    return {
      component: YieldSourceExpanded,
      props: { yieldSource }
    };
  }

  // Function to get unique ID for each row
  function getYieldSourceId(yieldSource: YieldSourceDisplayData): string {
    return yieldSource.id;
  }

  // Function to style rows (optional)
  function getRowClass(item: YieldSourceDisplayData, index: number): string {
    // Add any row-specific classes here
    // return item.isComposite ? 'composite-row' : '';
    return ''
  }
// State for refresh loading
  let isRefreshing = $state(false);
  let refreshError = $state<string | null>(null);

  async function refreshYieldData() {
    isRefreshing = true;
    refreshError = null;
    
    try {
      const response = await fetch('/api/v1/protected/yield-sources', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch yield sources: ${response.status} ${response.statusText}`);
      }

      const freshData: YieldSourceDisplayData[] = await response.json();
      yieldSources = freshData;
      
      console.log(`Refreshed ${freshData.length} yield sources`);
      
    } catch (error) {
      console.error('Failed to refresh yield data:', error);
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

  // Optional: Styling for composite rows
  :global(.composite-row) {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--blue-500);
    }
  }
</style>
