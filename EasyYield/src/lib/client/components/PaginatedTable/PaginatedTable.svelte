<script lang="ts" generics="T">
  import Icon from '@iconify/svelte';
  import { Button } from 'flowbite-svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { untrack, type Snippet } from 'svelte';
  import { page } from '$app/state';

  type Props = {
    data: T[];
    columns: Array<{
      key: keyof T;
      label: string;
      sortable?: boolean;
      render?: (item: any) => string | { component: Snippet, props: any };
    }>;
    pageSize?: number;
    title?: string;
    itemName?: string;
    rowClass: (item: T, index: number) => string,
    syncWithUrl?: boolean; // New prop to enable URL sync
  };

  let { 
    data, 
    columns, 
    pageSize = 25, 
    title, 
    itemName = 'items',
    rowClass,
    syncWithUrl = true 
  }: Props = $props();

  // Get URL params
  let searchParams = $derived(page.url.searchParams);
  
  // Initialize state from URL params or defaults
  let currentPage = $state(1);
  let sortBy: keyof T | undefined = $state(undefined);
  let sortAsc = $state(false);
  let currentPageSize = $state(pageSize);
  
  // Initialize from URL on mount
  $effect(() => {
    if (!browser || !syncWithUrl) return;
    untrack(() => {

      const urlPage = parseInt(searchParams.get('page') || '1');
      const urlSortBy = searchParams.get('sortBy') as keyof T;
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

  let sortedData: T[] = $state([]);
  let displayedData: T[] = $state([]);
  
  $effect(() => {
    data; currentPage; sortBy; sortAsc; currentPageSize
    untrack(() => {
      if (!sortBy) {
        const startIndex = (currentPage - 1) * currentPageSize;
        const endIndex = startIndex + currentPageSize;
        displayedData = data.slice(startIndex, endIndex);
        return;
      }
      sortedData = [...data].sort((a, b) => {
        const aVal = a[sortBy as keyof T];
        const bVal = b[sortBy as keyof T];
        
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
  
      // Calculate pagination
      const startIndex = (currentPage - 1) * currentPageSize;
      const endIndex = startIndex + currentPageSize;
      displayedData = sortedData.slice(startIndex, endIndex);
    });
    })

  // Pagination calculations
  let totalPages = $derived(Math.ceil(sortedData.length / currentPageSize));
  let startItem = $derived((currentPage - 1) * currentPageSize + 1);
  let endItem = $derived(Math.min(currentPage * currentPageSize, sortedData.length));

  function doSort(field: keyof T) {
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
        {#each displayedData as item, index (index)}
          <tr class={rowClass ? rowClass(item, index) : ''}>
            {#each columns as column}
              <td>
                {#if column.render}
                  {@const rendered = column.render(item)}
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
          </tr>
        {/each}
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
            onchange={(e) => changePageSize(parseInt(e.target?.value))}
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
  min-width: 600px;

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
</style>

