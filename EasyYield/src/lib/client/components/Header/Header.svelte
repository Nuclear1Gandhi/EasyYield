<script lang="ts">
  import Icon  from '@iconify/svelte';
  import { onMount } from 'svelte';
  import { useRadixAuth } from '$client/hooks/useRadixAuth';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';
  import MainSearch from './MainSearch.svelte';
  import { Protocols } from '$shared/typings/YieldSource';
  import Filters, { type FilterOptions } from './Filters.svelte';

  type Props =  {};
  let {}: Props = $props();

  onMount(() => {
    useRadixAuth();
  });

  let sidebarOpen = $state(false);

  // Filter state for FilterBar
  let filters = $state<FilterOptions>({
    yieldSourceType: [],
    protocols: [],
    apyRange: [0, 50],
    tvlRange: [0, 10000000],
    riskLevels: [],
    hasIncentives: null,
    instantLiquidity: null,
    principalProtection: null
  });

  function handleFilterChange(o: FilterOptions) {
    filters = o;
    // TODO: React to filter changes (e.g., refresh data)
    console.log('Filters updated:', filters);
  }

  function handleSearchSelect(result: YieldSourceDisplayData) {
    let externalUrl: string | null = null;
    
    switch (result.protocolMetadata?.protocol) {
      case Protocols.CAVIARNINE:
        externalUrl = `https://app.caviarnine.com/pool/${result.id}`;
        break;
        
      case Protocols.OCISWAP:
        externalUrl = `https://ociswap.com/pools/${result.id}`;
        break;
        
      default:
        if (result.id.startsWith('component_rdx1')) {
          externalUrl = `https://radixscan.io/account/${result.id}`;
        }
        break;
    }
    
    if (externalUrl) {
      window.open(externalUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.warn(`No external URL mapping found for ${result.protocolName} pool: ${result.id}`);
    }
  }
</script>

<header class="app-header">
  <div class="brand">
    <button class="icon-btn" aria-label="Menu" onclick={() => (sidebarOpen = !sidebarOpen)}>
      {#if sidebarOpen}
        <Icon icon="tabler:x" width="20" height="20" />
      {:else}
        <Icon icon="tabler:menu-2" width="20" height="20" />
      {/if}
    </button>
    <img src="/logo.png" alt="logo" class="logo" aria-hidden="true" />
    <div class="name">EasyYield</div>
  </div>

  <div class="top-actions">
    <div class="centered-search-filters">
      <div class="main-search">
        <MainSearch
          placeholder="Search yield sources..." 
          onSelect={handleSearchSelect}
        />
      </div>
      <div class="filter-bar">
        <Filters 
          {filters} 
          onFiltersChange={(f) => {
            handleFilterChange(f)
          }} 
        />
      </div>
    </div>
  
    <div class="right-actions">
      <radix-connect-button></radix-connect-button>
    </div>
  </div>
</header>

<style lang="scss">
  @use '$client/styles/variables' as *;
  @use '$client/styles/mixins' as *;

  .app-header {
    grid-area: header;
    position: sticky;
    top: 0;
    z-index: 40;
    background: var(--surface-1);
    border-bottom: 1px solid var(--border-weak);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    gap: 12px;
  }
    .centered-search-filters {
      display: flex;
      align-items: center;
      flex-direction: row;
      gap: 16px;
      /* Center horizontally inside flex container */
      margin-left: auto;
      margin-right: auto;
      max-width: 680px;
      flex-shrink: 1;
    }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;

    .icon-btn {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: var(--radius);
      border: 1px solid transparent;
      background: transparent;
      color: var(--gray-300);
      transition: background var(--dur-med) var(--easing-standard), border-color var(--dur-med) var(--easing-standard), color var(--dur-med) var(--easing-standard);

      &:hover {
        background: var(--surface-2);
        border-color: var(--border-weak);
        color: var(--gray-100);
      }

      @include respond-to(lg) {
        display: none;
      }
    }



    .logo {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset;
    }

    .name {
      font-weight: 600;
      letter-spacing: 0.2px;
      color: var(--fg);
      font-size: 1.1rem;

      @media (max-width: 480px) {
        display: none;
      }
    }
  }

  .top-actions {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: center;

    .main-search {
      flex-grow: 1;
      width: 620px;

      @media (max-width: 768px) {
        max-width: 280px;
      }
    }

    .filter-bar {
      min-width: 240px;
      max-width: 360px;

      @media (max-width: 768px) {
        display: none; /* Optionally hide or move filter bar on mobile */
      }
    }
  }

  .right-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: flex-end;

    @media (max-width: 480px) {
      gap: 8px;
    }
  }
</style>
