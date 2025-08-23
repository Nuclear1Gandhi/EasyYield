<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import '$client/styles/app.scss'
  import type { PageData } from './$types';

  let {data}: { data: PageData } = $props() 

  // Reactive search handling
  let searchInput = $state(data.search);
  let searchTimeout: NodeJS.Timeout;

  function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const params = new URLSearchParams(page.url.searchParams);
      if (searchInput) {
        params.set('search', searchInput);
      } else {
        params.delete('search');
      }
      params.set('page', '1'); // Reset to first page when searching
      goto(`?${params.toString()}`, { replaceState: true });
    }, 300); // Debounce search
  }

  function handlePageChange(newPage: number) {
    const params = new URLSearchParams(page.url.searchParams);
    params.set('page', newPage.toString());
    goto(`?${params.toString()}`);
  }

  function handlePageSizeChange(newPageSize: number) {
    const params = new URLSearchParams(page.url.searchParams);
    params.set('pageSize', newPageSize.toString());
    params.set('page', '1'); // Reset to first page when changing page size
    goto(`?${params.toString()}`);
  }

  function copyAddress(address: string) {
    navigator.clipboard.writeText(address);
    // Add a toast notification here if you have one
  }

  // Pagination helper function
  function getPageNumbers(currentPage: number, totalPages: number) {
    const maxVisible = 5;
    const pages: number[] = [];
    
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
</script>

<svelte:head>
  <title>Dev: dApp Definitions Explorer</title>
</svelte:head>

<div class="dev-page">
  <header class="dev-header">
    <h1>🔧 dApp Definitions Explorer</h1>
    <div class="network-info">
      <span class="network-badge" class:stokenet={data.network === 'stokenet'}>
        {data.network}
      </span>
      <code class="endpoint">{data.endpoint}</code>
    </div>
  </header>

  {#if data.error}
    <div class="error">
      ❌ {data.error}
    </div>
  {:else}
    <!-- Search and Controls -->
    <div class="controls">
      <div class="search-section">
        <input
          type="text"
          placeholder="Search dApps by name, description, or address..."
          bind:value={searchInput}
          oninput={handleSearch}
          class="search-input"
        />
      </div>
      
      <div class="stats">
        <span class="count">
          Showing {data.dapps.length} of {data.pagination.totalItems} dApps
        </span>
        
        <select 
          class="page-size-select" 
          onchange={(e) => handlePageSizeChange(parseInt(e.currentTarget.value))}
        >
          <option value="10" selected={data.pagination.pageSize === 10}>10 per page</option>
          <option value="20" selected={data.pagination.pageSize === 20}>20 per page</option>
          <option value="50" selected={data.pagination.pageSize === 50}>50 per page</option>
          <option value="100" selected={data.pagination.pageSize === 100}>100 per page</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="table-container">
      <table class="dapps-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Address</th>
            <th>Icon</th>
            <th>Description</th>
            <th>Website</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each data.dapps as dapp, index (index)}
            <tr>
              <td class="name">
                <span class="dapp-name">
                  {dapp.name || 'Unnamed dApp'}
                </span>
              </td>
              <td class="address">
                <code class="address-code">
                  {dapp.address}
                </code>
              </td>
              <td class="icon">
                {#if dapp.icon_url}
                  <img 
                    src={dapp.icon_url} 
                    alt="dApp Icon" 
                    class="dapp-icon"
                  />
                  <span class="no-icon" style="display: none;">❌</span>
                {:else}
                  <span class="no-icon">❌</span>
                {/if}
              </td>
              <td class="description">
                {dapp.description || 'No description available'}
              </td>
              <td class="website">
                {#if dapp.website}
                  <a href={dapp.website} target="_blank" rel="noopener noreferrer" class="website-link">
                    🔗 Visit
                  </a>
                {:else}
                  <span class="no-website">-</span>
                {/if}
              </td>
              <td class="actions">
                <button 
                  class="copy-btn"
                  onclick={() => copyAddress(dapp.dapp_definition)}
                  title="Copy address to clipboard"
                >
                  📋
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    {#if data.pagination.totalPages > 1}
      <div class="pagination">
        <div class="pagination-info">
          Page {data.pagination.currentPage} of {data.pagination.totalPages}
        </div>
        
        <div class="pagination-controls">
          <!-- First page -->
          <button 
            class="page-btn"
            disabled={!data.pagination.hasPreviousPage}
            onclick={() => handlePageChange(1)}
            title="First page"
          >
            ⏮️
          </button>
          
          <!-- Previous page -->
          <button 
            class="page-btn"
            disabled={!data.pagination.hasPreviousPage}
            onclick={() => handlePageChange(data.pagination.currentPage - 1)}
            title="Previous page"
          >
            ⏪
          </button>
          
          <!-- Page numbers -->
          {#each getPageNumbers(data.pagination.currentPage, data.pagination.totalPages) as pageNum}
            <button 
              class="page-btn"
              class:active={pageNum === data.pagination.currentPage}
              onclick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </button>
          {/each}
          
          <!-- Next page -->
          <button 
            class="page-btn"
            disabled={!data.pagination.hasNextPage}
            onclick={() => handlePageChange(data.pagination.currentPage + 1)}
            title="Next page"
          >
            ⏩
          </button>
          
          <!-- Last page -->
          <button 
            class="page-btn"
            disabled={!data.pagination.hasNextPage}
            onclick={() => handlePageChange(data.pagination.totalPages)}
            title="Last page"
          >
            ⏭️
          </button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style lang="scss">
.dev-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: system-ui, -apple-system, sans-serif;
}

.dev-header {
  margin-bottom: 24px;
  
  h1 {
    color: #333;
    margin-bottom: 8px;
    font-size: 28px;
  }
}

.network-info {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .network-badge {
    padding: 4px 8px;
    border-radius: 4px;
    background: #e1f5fe;
    color: #0277bd;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    
    &.stokenet {
      background: #fff3e0;
      color: #e65100;
    }
  }
  
  .endpoint {
    font-size: 11px;
    color: #666;
    font-family: 'Courier New', monospace;
  }
}

.error {
  padding: 20px;
  background: #ffebee;
  color: #c62828;
  border-radius: 8px;
  border-left: 4px solid #d32f2f;
  margin-bottom: 20px;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  
  .search-section {
    flex: 1;
  }
  
  .search-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 14px;
    
    &:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.1);
    }
  }
  
  .stats {
    display: flex;
    align-items: center;
    gap: 16px;
    
    .count {
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }
    
    .page-size-select {
      padding: 6px 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 12px;
      background: white;
    }
  }
}

.table-container {
  overflow-x: auto;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  margin-bottom: 20px;
}

.dapps-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: white;
  
  thead th {
    background: #f5f5f5;
    padding: 12px 8px;
    text-align: left;
    border-bottom: 2px solid #e0e0e0;
    font-weight: 600;
    color: #333;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  tbody td {
    padding: 12px 8px;
    border-bottom: 1px solid #f0f0f0;
    vertical-align: top;
  }
  
  tbody tr:hover {
    background: #f9f9f9;
  }
  
  .name {
    min-width: 140px;
    max-width: 180px;
    
    .dapp-name {
      font-weight: 600;
      color: #333;
      display: block;
      word-break: break-word;
    }
  }
  
  .address {
    min-width: 180px;
    max-width: 220px;
    
    .address-code {
      font-family: 'Courier New', monospace;
      font-size: 10px;
      word-break: break-all;
      background: #f8f8f8;
      padding: 4px 6px;
      border-radius: 3px;
      display: block;
      color: #666;
    }
  }
  
  .icon {
    width: 50px;
    text-align: center;
    
    .dapp-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      object-fit: cover;
    }
    
    .no-icon {
      font-size: 16px;
      opacity: 0.5;
    }
  }
  
  .description {
    max-width: 300px;
    line-height: 1.4;
    color: #555;
  }
  
  .website {
    min-width: 80px;
    
    .website-link {
      color: #1976d2;
      text-decoration: none;
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 4px;
      border: 1px solid #1976d2;
      display: inline-block;
      transition: all 0.2s;
      
      &:hover {
        background: #1976d2;
        color: white;
      }
    }
    
    .no-website {
      color: #999;
      font-style: italic;
    }
  }
  
  .actions {
    width: 60px;
    text-align: center;
    
    .copy-btn {
      background: #f0f0f0;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 6px 8px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.2s;
      
      &:hover {
        background: #e0e0e0;
        transform: translateY(-1px);
      }
    }
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
  
  .pagination-info {
    color: #666;
    font-size: 14px;
  }
  
  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .page-btn {
      background: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 8px 12px;
      cursor: pointer;
      font-size: 13px;
      color: #333;
      transition: all 0.2s;
      min-width: 40px;
      
      &:hover:not(:disabled) {
        border-color: #1976d2;
        color: #1976d2;
      }
      
      &.active {
        background: #1976d2;
        border-color: #1976d2;
        color: white;
      }
      
      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }
}

@media (max-width: 768px) {
  .controls {
    flex-direction: column;
    align-items: stretch;
    
    .stats {
      justify-content: space-between;
    }
  }
  
  .pagination {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .dapps-table {
    font-size: 11px;
    
    .address-code {
      font-size: 9px;
    }
  }
}
</style>
