<script lang="ts" generics="T">
  import Icon from '@iconify/svelte';
  import { Button } from 'flowbite-svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { untrack, type Snippet } from 'svelte';
  import { page } from '$app/state';
  type Column = {
      key: keyof RowItem;
      label: string;
      sortable?: boolean;
      render?: (item: any) => string | { component: any, props: any };
    }
  type RowItem = T & { _id?: any, id?: any }
  type Props = {
    data: RowItem[];
    columns: Column[];
    pageSize?: number;
    title?: string;
    itemName?: string;
    rowClass: (item: RowItem, index: number) => string,
    syncWithUrl?: boolean; // New prop to enable URL sync
    empty?: Snippet
    expandable?: boolean;
    expandedRowRender?: (item: RowItem) => { component: any, props: any };
    defaultExpandedRows?: Set<string>;
    getRowId?: (item: RowItem) => string; // Function to get unique ID for each row
  };

  let { 
    data, 
    columns, 
    pageSize = 25, 
    title, 
    itemName = 'items',
    rowClass,
    syncWithUrl = true,
    expandable,
    expandedRowRender,
    defaultExpandedRows,
    getRowId,
    empty
  }: Props = $props();

  // Get URL params
  let searchParams = $derived(page.url.searchParams);
  
  // Initialize state from URL params or defaults
  let currentPage = $state(1);
  let sortBy: keyof RowItem | undefined = $state(undefined);
  let sortAsc = $state(false);
  let currentPageSize = $state(pageSize);
  
  let expandedRows = $state(new Set<string>(defaultExpandedRows || []));

  function toggleRowExpansion(item: RowItem) {
    const id = getRowId?.(item) || String(item.id || item._id);
    
    if (expandedRows.has(id)) {
      expandedRows.delete(id);
    } else {
      expandedRows.add(id);
    }
    expandedRows = new Set(expandedRows); // Trigger reactivity
  }

  function isRowExpanded(item: RowItem): boolean {
    const id = getRowId?.(item) || String(item.id || item._id);
    return expandedRows.has(id);
  }

  // Initialize from URL on mount
  $effect(() => {
    if (!browser || !syncWithUrl) return;
    untrack(() => {

      const urlPage = parseInt(searchParams.get('page') || '1');
      const urlSortBy = searchParams.get('sortBy') as keyof RowItem;
      const urlSortAsc = searchParams.get('sortAsc') === 'true';
      const urlPageSize = parseInt(searchParams.get('pageSize') || pageSize.toString());
      
      // Only update if values are valid
      if (urlPage > 0) currentPage = urlPage;
      if (urlSortBy && columns.some(col => col.key === urlSortBy)) {
        sortBy = urlSortBy;
      }
      sortAsc = urlSortAsc;
      if (urlPageSize > 0) currentPageSize = urlPageSize;
    })
  });

  // Update URL when state changes
  function updateUrl() {
    if (!browser || !syncWithUrl) return;
    
    const url = new URL(page.url);
    url.searchParams.set('page', currentPage.toString());
    if (sortBy) url.searchParams.set('sortBy', sortBy.toString());
    url.searchParams.set('sortAsc', sortAsc.toString());
    url.searchParams.set('pageSize', currentPageSize.toString());
    
    goto(url.toString(), { 
      replaceState: true, 
      noScroll: true, 
      keepFocus: true 
    });
  }

  let sortedData: RowItem[] = $state([]);
  let displayedData: RowItem[] = $state([]);
  
  $effect(() => {
    data; currentPage; sortBy; sortAsc; currentPageSize
    untrack(() => {
      // Always set sortedData
      if (sortBy) {
        sortedData = [...data].sort((a, b) => {
          const aVal = a[sortBy as keyof RowItem];
          const bVal = b[sortBy as keyof RowItem];
          
          // Handle numeric sorting
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            const aNum = parseFloat(aVal);
            const bNum = parseFloat(bVal);
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return sortAsc ? aNum - bNum : bNum - aNum;
            }
          }
          
          // String/generic sorting
          return sortAsc
            ? aVal > bVal ? 1 : -1
            : aVal < bVal ? 1 : -1;
        });
      } else {
        sortedData = data; // No sorting, just use original data
      }

      // Calculate pagination from sortedData
      const startIndex = (currentPage - 1) * currentPageSize;
      const endIndex = startIndex + currentPageSize;
      displayedData = sortedData.slice(startIndex, endIndex);
    });
  })

  // Pagination calculations
  let totalPages = $derived(Math.ceil(sortedData.length / currentPageSize));
  let startItem = $derived((currentPage - 1) * currentPageSize + 1);
  let endItem = $derived(Math.min(currentPage * currentPageSize, sortedData.length));

  function doSort(field: keyof RowItem) {
    if (sortBy === field) {
      sortAsc = !sortAsc;
    } else {
      sortBy = field;
      sortAsc = false;
    }
    currentPage = 1; // Reset to first page when sorting
    updateUrl();
  }

  function goToPage(page: number) {
    currentPage = Math.max(1, Math.min(page, totalPages));
    updateUrl();
  }

  function changePageSize(newSize: number) {
    currentPageSize = newSize;
    currentPage = 1; // Reset to first page when changing page size
    updateUrl();
  }

  // Generate page numbers for pagination controls
  let visiblePages = $derived(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); 
         i <= Math.min(totalPages - 1, currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter((item, index, array) => array.indexOf(item) === index);
  });

  function getRenderedContent(item: RowItem, column: Column) {
    if (!column.render) return item[column.key];
    
    const rendered = column.render(item);
    return rendered;
  }
</script>

<div class="paginated-table-container">
  {#if title}
    <div class="table-header">
      <h2>{title}</h2>
      <div class="table-info">
        Showing {startItem}–{endItem} of {sortedData.length} {itemName}
      </div>
    </div>
  {/if}

  <div class="table-scroll">
    <table class="paginated-table">
      <thead>
        <tr>
          {#each columns as column}
            <th 
              class:sortable={column.sortable !== false}
              onclick={column.sortable !== false ? () => doSort(column.key) : undefined}
            >
              <div class="col-head">
                {column.label}
                {#if column.sortable !== false}
                  <Icon 
                    icon={sortBy === column.key 
                      ? (sortAsc ? 'tabler:chevron-up' : 'tabler:chevron-down') 
                      : 'tabler:chevrons-up-down'
                    } 
                    width="16"
                  />
                {/if}
              </div>
            </th>
          {/each}
          
        </tr>
      </thead>
<tbody>
  {#if displayedData.length === 0}
    <tr>
      <td colspan={expandable ? columns.length + 1 : columns.length} class="empty-state-cell">
        {#if empty}
          {@render empty()}
        {:else}
          <div class="default-empty-state">
            <Icon icon="tabler:database-off" width="48" />
            <p>No {itemName} found</p>
          </div>
        {/if}
      </td>
    </tr>
  {:else}
    {#each displayedData as item, index (item.id)}
      <tr class={rowClass ? rowClass(item, index) : ''}>
        {#each columns as column}
          <td>
             {#if column.render}
              {@const rendered = getRenderedContent(item, column)}
              {#if typeof rendered === 'string'}
                {@html rendered}
              {:else}
                {@const { component: Component, props } = rendered}
                <Component {...props} />
              {/if}
            {:else}
              {item[column.key]}
            {/if}
          </td>
        {/each}

        {#if expandable}
          <td class="expand-cell">
            <button 
              class="expand-button"
              onclick={() => toggleRowExpansion(item)}
              aria-label={isRowExpanded(item) ? 'Collapse row' : 'Expand row'}
            >
              <Icon 
                icon={isRowExpanded(item) ? 'tabler:chevron-up' : 'tabler:chevron-down'} 
                width="16" 
              />
            </button>
          </td>
        {/if}
      </tr>

      {#if expandable && isRowExpanded(item) && expandedRowRender}
        {@const { component: Component, props } = expandedRowRender(item)}
        <tr class="expanded-row">
          <td colspan={expandable ? columns.length + 1 : columns.length} class="expanded-cell">
            <Component {...props} />
          </td>
        </tr>
      {/if}
    {/each}
  {/if}
</tbody>
    </table>
  </div>

  {#if totalPages > 1}
    <div class="pagination">
      <div class="pagination-info">
        Page {currentPage} of {totalPages}
      </div>
      
      <div class="pagination-controls">
        <Button 
          size="sm" 
          color="alternative" 
          disabled={currentPage === 1}
          onclick={() => goToPage(currentPage - 1)}
        >
          <Icon icon="tabler:chevron-left" width="16" />
          Previous
        </Button>

        {#each visiblePages() as _page}
          {#if _page === '...'}
            <span class="pagination-ellipsis">…</span>
          {:else}
            <Button 
              size="sm" 
              color={currentPage === _page ? "primary" : "alternative"}
              onclick={() => goToPage(Number(_page))}
            >
              {_page}
            </Button>
          {/if}
        {/each}

        <Button 
          size="sm" 
          color="alternative" 
          disabled={currentPage === totalPages}
          onclick={() => goToPage(currentPage + 1)}
        >
          Next
          <Icon icon="tabler:chevron-right" width="16" />
        </Button>
      </div>

      <div class="page-size-selector">
        <label>
          Show:
          <select 
            value={currentPageSize} 
            onchange={(e: any) => changePageSize(parseInt(e.target?.value ))}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          per page
        </label>
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  
.empty-state-cell {
  text-align: center;
  padding: 40px 20px;
  color: var(--gray-400);
  font-style: italic;
}  
.paginated-table-container {
  background: var(--surface-1);
  border-radius: var(--radius);
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  margin-bottom: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 12px 20px;
  border-bottom: 1px solid var(--border-weak);

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--fg);
  }

  .table-info {
    font-size: 14px;
    color: var(--gray-400);
  }
}

.table-scroll {
  overflow-x: auto;
}

.col-head {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0;
}

.paginated-table {
  width: 100%;
  border-collapse: collapse;
  // min-width: 600px;

  th, td {
    padding: 12px 14px;
    text-align: left;
    white-space: nowrap;
  }

  th {
    font-size: 13px;
    color: var(--gray-400);
    user-select: none;
    
    &.sortable {
      cursor: pointer;
      transition: color var(--dur-fast) var(--easing-standard);
      
      &:hover {
        color: var(--fg);
      }
    }
  }

  tbody tr {
    border-top: 1px solid var(--border-weak);
    transition: background var(--dur-fast) var(--easing-standard);

    &:hover {
      background: var(--surface-2);
    }
  }
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--border-weak);
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
  }
}

.pagination-info {
  font-size: 14px;
  color: var(--gray-400);
  white-space: nowrap;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.pagination-ellipsis {
  padding: 0 8px;
  color: var(--gray-400);
}

.page-size-selector {
  font-size: 14px;
  color: var(--gray-400);
  white-space: nowrap;

  select {
    background: var(--surface-2);
    border: 1px solid var(--border-weak);
    border-radius: var(--radius);
    padding: 4px 8px;
    color: var(--fg);
    margin: 0 4px;
  }
}

.expand-cell {
  width: 48px;
  padding: 8px !important;
}

.expand-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: var(--gray-400);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: var(--surface-2);
    color: var(--gray-200);
  }
}

.expand-header {
  width: 48px;
}

.expanded-row {
  background: var(--surface-1);
  
  &:hover {
    background: var(--surface-1) !important;
  }
}

.expanded-cell {
  padding: 0 !important;
  border-top: 1px solid var(--border-weak);
}

.empty-state-cell {
  text-align: center;
  padding: 40px 20px;
  color: var(--gray-400);
  
  .default-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    
    p {
      margin: 0;
      font-size: 14px;
    }
  }
}
</style>

