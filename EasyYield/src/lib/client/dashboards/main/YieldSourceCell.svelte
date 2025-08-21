<!-- src/client/components/YieldSourceCell.svelte -->
<script lang="ts">
  import DappBadge from "$client/components/DappBadge/DappBadge.svelte";
  import TokenPairIcon from "$client/components/TokenPairIcon/TokenPairIcon.svelte";
  import type { YieldSourceDisplayData } from "$shared/typings/Api";

  let { row }: { row: YieldSourceDisplayData } = $props();

  // Vault categorization logic
  let hasVault = $derived(row.hasVault || false);
  let vaultCategory = $derived(row.vaultCategory || 'BASIC_DEX');
  let isComposite = $derived(row.isComposite || false);
  
  // Display labels based on vault status
  let vaultLabel = $derived(hasVault ? 'Premium Vault' : 'Basic Pool');
  let vaultIcon = $derived(hasVault ? '🏦' : '💧');
  
  // Benefit indicators
  let vaultBenefits = $derived(hasVault ? [
    'Protocol Revenue Sharing',
    'Enhanced APY',
    'Governance Rewards',
    'Advanced Features'
  ] : ['Standard Trading Fees']);
</script>

<div class="yield-source-cell" class:has-vault={hasVault}>
  <TokenPairIcon 
    tokenIcons={row.tokenIcons} 
    tokenSymbols={row.tokenSymbols}
    size="md" 
  />
  
  <div class="yield-source-info">
    <div class="name-row">
      <span class="yield-source-name" title={row.name}>
        {row.displayName || row.name}
      </span>
      
      <!-- Vault Status Badge -->
      <div class="vault-badge" class:premium={hasVault} class:basic={!hasVault}>
        <span class="vault-icon">{vaultIcon}</span>
        <span class="vault-label">{vaultLabel}</span>
      </div>
      
      <DappBadge
        dappIcon={row.dappIcon} 
        dappName={row.dappName}
        size="sm" 
      />
    </div>
    
    <div class="yield-details">
      <div class="yield-source-type">
        {row.type}
        {#if isComposite}
          <span class="composite-indicator">• Composite Yield</span>
        {/if}
      </div>
      
      <!-- Vault Benefits Preview -->
      {#if hasVault}
        <div class="vault-benefits">
          <span class="benefit-preview">
            {vaultBenefits.slice(0, 2).join(' • ')}
          </span>
          {#if vaultBenefits.length > 2}
            <span class="more-benefits">+{vaultBenefits.length - 2} more</span>
          {/if}
        </div>
      {:else}
        <div class="basic-pool-info">
          <span class="limitation-note">Standard DEX pool - trading fees only</span>
        </div>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
.yield-source-cell {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px;
  border-radius: 8px;
  transition: all 0.2s ease;

  &.has-vault {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%);
    border-left: 3px solid var(--blue-500);
  }

  &:hover {
    background: var(--gray-50);
    
    &.has-vault {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%);
    }
  }
}

.yield-source-info {
  flex: 1;
  min-width: 0; // Allow text truncation
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.yield-source-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
  flex-shrink: 1;
}

.vault-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;

  &.premium {
    background: linear-gradient(135deg, var(--blue-100) 0%, var(--purple-100) 100%);
    color: var(--blue-700);
    border: 1px solid var(--blue-200);
  }

  &.basic {
    background: var(--gray-100);
    color: var(--gray-600);
    border: 1px solid var(--gray-200);
  }
}

.vault-icon {
  font-size: 10px;
}

.vault-label {
  font-size: 10px;
  line-height: 1;
}

.yield-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.yield-source-type {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--gray-500);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.composite-indicator {
  color: var(--blue-600);
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;
}

.vault-benefits {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--blue-600);
  font-weight: 500;
}

.benefit-preview {
  color: var(--blue-700);
}

.more-benefits {
  color: var(--blue-500);
  font-weight: 600;
  font-style: italic;
}

.basic-pool-info {
  font-size: 11px;
}

.limitation-note {
  color: var(--gray-500);
  font-style: italic;
}

// Responsive adjustments
@media (max-width: 768px) {
  .yield-source-cell {
    gap: 8px;
  }
  
  .yield-source-name {
    max-width: 120px;
    font-size: 13px;
  }
  
  .vault-badge {
    padding: 1px 6px;
  }
  
  .vault-label {
    font-size: 9px;
  }
  
  .vault-benefits,
  .basic-pool-info {
    font-size: 10px;
  }
}
</style>
