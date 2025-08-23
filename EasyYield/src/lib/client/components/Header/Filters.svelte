<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Button, clickOutside, Dropdown, DropdownItem } from 'flowbite-svelte';
  
  export type FilterOptions = {
    yieldSourceType: string[];
    protocols: string[];
    apyRange: [number, number];
    tvlRange: [number, number];
    riskLevels: string[];
    hasIncentives: boolean | null;
    instantLiquidity: boolean | null;
    principalProtection: boolean | null;
  };

  type Props = {
    filters: FilterOptions;
    onFiltersChange: (filters: FilterOptions) => void;
  };

  let { filters, onFiltersChange }: Props = $props();

  // Local state
  let showMoreFilters = $state(false);
  let activeFilterCount = $derived(getActiveFilterCount());

  // Available options
  const yieldSourceTypes = [
    { value: 'DEX_PAIR', label: 'DEX Pools' },
    { value: 'LSU_POOL', label: 'LSU Pools' },
    { value: 'VALIDATOR_STAKING', label: 'Validator Staking' },
    { value: 'LSU_HYPERSTAKE', label: 'HyperStake' }
  ];

  const protocols = [
    { value: 'CAVIARNINE', label: 'CaviarNine' },
    { value: 'OCISWAP', label: 'Ociswap' }
  ];

  const riskLevels = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' }
  ];

  function getActiveFilterCount(): number {
    let count = 0;
    if (filters.yieldSourceType.length > 0) count++;
    if (filters.protocols.length > 0) count++;
    if (filters.apyRange[0] > 0 || filters.apyRange[1] < 50) count++;
    if (filters.tvlRange[0] > 0 || filters.tvlRange[1] < 10000000) count++;
    if (filters.riskLevels.length > 0) count++;
    if (filters.hasIncentives !== null) count++;
    if (filters.instantLiquidity !== null) count++;
    if (filters.principalProtection !== null) count++;
    return count;
  }

  function updateFilters(updates: Partial<FilterOptions>) {
    // Create a completely new object to ensure reactivity
    const newFilters = { ...filters, ...updates };
    onFiltersChange(newFilters);
  }

  function toggleArrayFilter(array: string[], value: string) {
    if (array.includes(value)) {
      return array.filter(v => v !== value);
    } else {
      return [...array, value];
    }
  }

  function clearAllFilters() {
    onFiltersChange({
      yieldSourceType: [],
      protocols: [],
      apyRange: [0, 50],
      tvlRange: [0, 10000000],
      riskLevels: [],
      hasIncentives: null,
      instantLiquidity: null,
      principalProtection: null
    });
  }

  // Handle checkbox toggle - don't close dropdown
  function handleTypeToggle(value: string) {
    updateFilters({ 
      yieldSourceType: toggleArrayFilter(filters.yieldSourceType, value) 
    });
  }

  function handleProtocolToggle(value: string) {
    updateFilters({ 
      protocols: toggleArrayFilter(filters.protocols, value) 
    });
  }
</script>

<div class="filter-bar">
  <div class="primary-filters">
    <div class="filter-group">
      <Button color="alternative" size="sm" class="filter-dropdown">
        <Icon icon="tabler:stack" width="16" />
        Type
        {#if filters.yieldSourceType.length > 0}
          <span class="filter-count">{filters.yieldSourceType.length}</span>
        {/if}
        <Icon icon="tabler:chevron-down" width="14" />
      </Button>
      <Dropdown class="filter-dropdown-menu">
        {#each yieldSourceTypes as type (type.value)}
          <DropdownItem class="filter-dropdown-item">
            <label 
              class="checkbox-label"
              onclick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTypeToggle(type.value)
              }}
            >
              <input 
                type="checkbox" 
                checked={filters.yieldSourceType.includes(type.value)}
                class="filter-checkbox"
                onclick={(e) => {
                  e.stopPropagation()
                }}
                readonly
              />
              <span class="filter-label">{type.label}</span>
            </label>
          </DropdownItem>
        {/each}
      </Dropdown>
    </div>

    <!-- Protocol -->
    <div class="filter-group">
      <Button color="alternative" size="sm" class="filter-dropdown">
        <Icon icon="tabler:apps" width="16" />
        Dapps
        {#if filters.protocols.length > 0}
          <span class="filter-count">{filters.protocols.length}</span>
        {/if}
        <Icon icon="tabler:chevron-down" width="14" />
      </Button>
      <Dropdown class="filter-dropdown-menu">
        {#each protocols as protocol (protocol.value)}
          <DropdownItem class="filter-dropdown-item">
            <label 
              class="checkbox-label"
              onclick={(e) => {
                handleProtocolToggle(protocol.value);
                e.stopPropagation()
                e.preventDefault()
              }}
            >
              <input 
                type="checkbox" 
                checked={filters.protocols.includes(protocol.value)}
                class="filter-checkbox"
                onclick={(e) => {
                  e.stopPropagation()
                }}
                readonly
              />
              <span class="filter-label">{protocol.label}</span>
            </label>
          </DropdownItem>
        {/each}
      </Dropdown>
    </div>

    <!-- More Filters Toggle -->
    <!-- <Button 
      color="alternative" 
      size="sm" 
      class="more-filters-btn"
      onclick={() => showMoreFilters = !showMoreFilters}
    >
      <Icon icon="tabler:adjustments" width="16" />
      More Filters
      {#if activeFilterCount > (filters.yieldSourceType.length > 0 ? 1 : 0) + (filters.protocols.length > 0 ? 1 : 0)}
        <span class="filter-count">{activeFilterCount - (filters.yieldSourceType.length > 0 ? 1 : 0) - (filters.protocols.length > 0 ? 1 : 0)}</span>
      {/if}
      <Icon icon={showMoreFilters ? "tabler:chevron-up" : "tabler:chevron-down"} width="14" />
    </Button> -->
  </div>

  <!-- Active Filters Summary -->
  {#if activeFilterCount > 0}
    <div class="active-filters">
      <span class="active-count">Active: {activeFilterCount} filters</span>
      <button class="clear-filters" onclick={clearAllFilters}>
        <Icon icon="tabler:x" width="14" />
      </button>
    </div>
  {/if}
</div>

<!-- Extended Filters Panel -->
{#if showMoreFilters}
  <div class="extended-filters" use:clickOutside={() => showMoreFilters = false}>
    <div class="filter-sections">
      <!-- Financial Metrics -->
      <div class="filter-section">
        <h4>Financial</h4>
        <div class="range-filter">
          <label class="range-label">APY Range</label>
          <div class="range-values">{filters.apyRange[0]}% - {filters.apyRange[1]}%</div>
        </div>
      </div>

      <!-- Risk & Features -->
      <div class="filter-section">
        <h4>Risk & Features</h4>
        <div class="checkbox-group">
          <label class="group-label">Risk Level</label>
          <div class="checkbox-pills">
            {#each riskLevels as risk}
              <button
                class="pill-checkbox"
                class:active={filters.riskLevels.includes(risk.value)}
                onclick={() => updateFilters({
                  riskLevels: toggleArrayFilter(filters.riskLevels, risk.value)
                })}
              >
                {risk.label}
              </button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Same SCSS styles as before -->
<style lang="scss">
  .filter-bar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 0;
    position: relative;
  }

  .primary-filters {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filter-group {
    position: relative;
  }

  :global(.filter-dropdown) {
    display: flex !important;
    align-items: center;
    gap: 6px;
    font-size: 13px !important;
    padding: 6px 10px !important;
  }

  .filter-count {
    background: var(--primary-500);
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 11px;
    font-weight: 600;
    min-width: 18px;
    text-align: center;
    line-height: 1;
  }

  // Override Flowbite dropdown styling
  :global(.filter-dropdown-menu) {
    min-width: 180px !important;
    padding: 4px !important;
    background: var(--surface-0) !important;
    border: 1px solid var(--border-weak) !important;
    border-radius: var(--radius) !important;
    box-shadow: var(--shadow-2) !important;
    list-style: none !important;
    
    ul {
      list-style: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }
  }

  :global(.filter-dropdown-item) {
    width: 100%;
    padding: 0 !important;
    margin: 0 !important;
    list-style: none !important;

    &::before {
      display: none !important;
    }
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    border-radius: 4px;
    transition: background-color 0.15s ease;
    color: var(--fg);
    font-size: 14px;
    width: 100%;
    user-select: none;

    &:hover {
      // background: var(--surface-2);
    }
  }

  :global(.filter-checkbox) {
    margin: 0 !important;
    accent-color: var(--primary-500) !important;
    width: 16px !important;
    height: 16px !important;
    pointer-events: none; /* Prevent direct checkbox clicks */
  }

  :global(.filter-label) {
    flex: 1;
  }

  .active-filters {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    font-size: 12px;
    color: var(--gray-400);
  }

  .clear-filters {
    background: none;
    border: none;
    color: var(--gray-400);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    transition: all 0.15s ease;
    
    &:hover {
      background: var(--surface-2);
      color: var(--gray-200);
    }
  }

  .extended-filters {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--surface-1);
    border: 1px solid var(--border-weak);
    border-radius: var(--radius);
    box-shadow: var(--shadow-2);
    z-index: 50;
    padding: 20px;
    margin-top: 4px;
  }

  .filter-sections {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
  }

  .filter-section {
    h4 {
      font-size: 14px;
      font-weight: 600;
      color: var(--fg);
      margin: 0 0 16px 0;
      border-bottom: 1px solid var(--border-weak);
      padding-bottom: 8px;
    }
  }

  .range-filter {
    margin-bottom: 20px;
    
    .range-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--gray-300);
      margin-bottom: 8px;
    }

    .range-values {
      font-size: 12px;
      color: var(--gray-400);
    }
  }

  .checkbox-group {
    .group-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--gray-300);
      margin-bottom: 8px;
    }
  }

  .checkbox-pills {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .pill-checkbox {
    padding: 6px 12px;
    border: 1px solid var(--border-weak);
    background: var(--surface-2);
    border-radius: 16px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    
    &:hover {
      border-color: var(--primary-400);
      background: var(--surface-3);
    }
    
    &.active {
      background: var(--primary-500);
      color: white;
      border-color: var(--primary-500);
    }
  }

  @media (max-width: 768px) {
    .filter-sections {
      grid-template-columns: 1fr;
      gap: 24px;
    }
    
    .primary-filters {
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .extended-filters {
      padding: 16px;
    }
  }
</style>
