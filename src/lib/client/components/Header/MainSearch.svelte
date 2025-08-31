<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Input } from 'flowbite-svelte';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';
  import { dashboardStore } from '$client/stores/dashboard';

  type Props = {
    placeholder?: string;
    onSelect?: (result: YieldSourceDisplayData) => void;
  };

  let { placeholder = 'Search yield sources...', onSelect }: Props = $props();

  // State
  let searchTerm = $state('');
  let debouncedTerm = $state('');
  let filteredResults = $state<YieldSourceDisplayData[]>([]);
  let isOpen = $state(false);
  let selectedIndex = $state(-1);
  let inputElement: HTMLInputElement;
  let flowbiteComponent: any;
  let resultsContainer = $state<HTMLElement | undefined>(undefined);

  // Get yield sources from store
  let yieldSources = $derived($dashboardStore.yieldSources || []);

  // Debounce utility
  function debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  }

  // Debounced search function
  const debouncedSearch = debounce((term: string) => {
    debouncedTerm = term;
  }, 200);

  // Filter function
  function filterYieldSources(query: string): YieldSourceDisplayData[] {
    if (!query.trim()) return [];
    
    const searchQuery = query.toLowerCase().trim();
    
    return yieldSources
      .filter(source => {
        // Search in name and displayName
        const nameMatch = source.name?.toLowerCase().includes(searchQuery) ||
                         source.displayName?.toLowerCase().includes(searchQuery);
        
        // Search in dapp name
        const dappMatch = source.protocolName?.toLowerCase().includes(searchQuery);
        
        // Search in token symbols
        const tokenMatch = source.tokenSymbols?.some(symbol => 
          symbol.toLowerCase().includes(searchQuery)
        );
        
        // Search in yield source ID (address)
        const addressMatch = source.id?.toLowerCase().includes(searchQuery);
        
        // Search in yield source type
        const typeMatch = source.type?.toLowerCase().replace('_', ' ').includes(searchQuery);
        
        return nameMatch || dappMatch || tokenMatch || addressMatch || typeMatch;
      })
      .slice(0, 8); // Limit to 8 results for better UX
  }

  $effect(() => {
    if (flowbiteComponent) {
      // Try different ways to access the input element
      inputElement = flowbiteComponent.$el?.querySelector('input') || 
                    flowbiteComponent.getElement?.() ||
                    document.querySelector('.search-input input');
    }
  });

  // React to search term changes
  $effect(() => {
    if (searchTerm.trim()) {
      debouncedSearch(searchTerm);
      isOpen = true;
    } else {
      debouncedTerm = '';
      filteredResults = [];
      isOpen = false;
      selectedIndex = -1;
    }
  });

  // React to debounced term changes
  $effect(() => {
    if (debouncedTerm.trim()) {
      filteredResults = filterYieldSources(debouncedTerm);
      selectedIndex = -1;
    } else {
      filteredResults = [];
    }
  });

  // Keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (!isOpen || filteredResults.length === 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        selectedIndex = selectedIndex < filteredResults.length - 1 ? selectedIndex + 1 : 0;
        scrollToSelected();
        break;
      
      case 'ArrowUp':
        event.preventDefault();
        selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : filteredResults.length - 1;
        scrollToSelected();
        break;
      
      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < filteredResults.length) {
          selectResult(filteredResults[selectedIndex]);
        }
        break;
      
      case 'Escape':
        event.preventDefault();
        closeSearch();
        break;
    }
  }

  function scrollToSelected() {
    if (!resultsContainer || selectedIndex < 0) return;
    
    const selectedElement = resultsContainer.children[selectedIndex + 1] as HTMLElement; // +1 to account for header
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }

  function selectResult(result: YieldSourceDisplayData) {
    searchTerm = result.displayName || result.name;
    closeSearch();
    onSelect?.(result);
  }

  function closeSearch() {
    isOpen = false;
    selectedIndex = -1;
    inputElement?.blur();
  }

  

  function handleClickOutside(event: MouseEvent) {
    const target = event.target as Element;
    if (!target.closest('.search-container')) {
      closeSearch();
    }
  }

  // Global click handler
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });

  // Focus management
  function handleFocus() {
    if (searchTerm.trim() && filteredResults.length > 0) {
      isOpen = true;
    }
  }

  function formatAPY(apy: string): string {
    return `${parseFloat(apy).toFixed(2)}%`;
  }

  // Highlight matching text
  function highlightMatch(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  let showClearButton = $derived(searchTerm.trim().length > 0);

</script>

<div class="search-container">
  <div class="search-input">
   <Input 
      bind:value={searchTerm}
      bind:this={flowbiteComponent}
      {placeholder}
      onkeydown={handleKeydown}
      onfocus={handleFocus}
      autocomplete="off"
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-activedescendant={selectedIndex >= 0 ? `result-${selectedIndex}` : undefined}
    >
      <span slot="left">
        <Icon icon="tabler:search" width="18" height="18" />
      </span>
    </Input>
  </div>

  {#if isOpen}
    <div 
      class="search-results" 
      bind:this={resultsContainer}
      role="listbox"
    >
      {#if debouncedTerm && filteredResults.length === 0}
        <div class="no-results">
          <Icon icon="tabler:search-off" width="20" height="20" />
          <span>No yield sources found for "{debouncedTerm}"</span>
        </div>
      {:else if filteredResults.length > 0}
        <div class="results-header">
          <span>{filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}</span>
        </div>
        
        {#each filteredResults as result, index}
          <button
            type="button"
            class="search-result"
            class:selected={index === selectedIndex}
            onclick={() => selectResult(result)}
            id="result-{index}"
            role="option"
            aria-selected={index === selectedIndex}
          >
            <div class="result-icon">
              {#if result.protocolIcon}
                <img src={result.protocolIcon} alt={result.protocolName} class="dapp-icon" />
              {:else}
                <div class="icon-placeholder">
                  <Icon icon="tabler:chart-line" width="20" height="20" />
                </div>
              {/if}
            </div>
            
            <div class="result-info">
              <div class="result-name">
                {@html highlightMatch(result.displayName || result.name, debouncedTerm)}
              </div>
              <div class="result-meta">
                <span class="dapp-name">
                  {@html highlightMatch(result.protocolName || '', debouncedTerm)}
                </span>
                <span class="separator">•</span>
                <span class="result-type">
                  {@html highlightMatch(result.type.replace('_', ' '), debouncedTerm)}
                </span>
                {#if result.tokenSymbols?.length > 0}
                  <span class="separator">•</span>
                  <span class="tokens">
                    {#each result.tokenSymbols as symbol, i}
                      {@html highlightMatch(symbol, debouncedTerm)}{#if i < result.tokenSymbols.length - 1}/{/if}
                    {/each}
                  </span>
                {/if}
              </div>
            </div>
            
            <div class="result-apy">
              {formatAPY(result.apy)}
            </div>

            {#if result.isComposite}
              <div class="composite-badge">
                <Icon icon="tabler:layers-linked" width="14" height="14" />
              </div>
            {/if}
          </button>
        {/each}

        {#if yieldSources.length > filteredResults.length}
          <div class="results-footer">
            Showing top {filteredResults.length} of {yieldSources.length} total sources
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
    .clear-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: none;
    background: transparent;
    color: var(--gray-400);
    border-radius: 4px;
    cursor: pointer;
    transition: color 0.15s ease;
    margin-left: 8px;

    &:hover {
      color: var(--gray-200);
    }
  }

  .search-container {
    position: relative;
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .clear-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border: none;
    background: transparent;
    color: var(--gray-400);
    border-radius: 4px;
    cursor: pointer;
    transition: color 0.15s ease;

    &:hover {
      color: var(--gray-200);
    }
  }

  .search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    background: var(--surface-0);
    border: 1px solid var(--border-weak);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 420px;
    overflow-y: auto;
    margin-top: 4px;
  }

  .results-header {
    padding: 8px 16px;
    font-size: 12px;
    color: var(--gray-400);
    background: var(--surface-2);
    border-bottom: 1px solid var(--border-weak);
    font-weight: 500;
  }

  .results-footer {
    padding: 8px 16px;
    font-size: 12px;
    color: var(--gray-400);
    border-top: 1px solid var(--border-weak);
    text-align: center;
    background: var(--surface-2);
  }

  .no-results {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px;
    color: var(--gray-400);
    font-size: 14px;
  }

  .search-result {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: transparent;
    cursor: pointer;
    text-align: left;
    transition: background 0.15s ease;
    border-bottom: 1px solid var(--border-weak);

    &:last-of-type {
      border-bottom: none;
    }

    &:hover,
    &.selected {
      background: var(--surface-2);
    }

    &.selected {
      background: var(--primary-50);
    }
  }

  .result-icon {
    flex-shrink: 0;
    width: 32px;
    height: 32px;

    .dapp-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      object-fit: cover;
    }

    .icon-placeholder {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      background: var(--surface-3);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--gray-400);
    }
  }

  .result-info {
    flex: 1;
    min-width: 0;

    .result-name {
      font-weight: 500;
      color: var(--fg);
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--gray-400);
      margin-top: 2px;

      .separator {
        color: var(--gray-500);
      }

      .dapp-name {
        font-weight: 500;
      }

      .tokens {
        color: var(--gray-300);
      }
    }
  }

  .result-apy {
    flex-shrink: 0;
    font-weight: 600;
    color: var(--primary);
    font-size: 14px;
  }

  .composite-badge {
    flex-shrink: 0;
    color: var(--blue-400);
    display: flex;
    align-items: center;
    opacity: 0.8;
  }

  :global(mark) {
    background: var(--primary-100);
    color: var(--primary-800);
    padding: 1px 2px;
    border-radius: 2px;
    font-weight: 600;
  }
</style>
