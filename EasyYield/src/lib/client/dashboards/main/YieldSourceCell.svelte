<script lang="ts">
  import DappBadge from "$client/components/DappBadge/DappBadge.svelte";
  import TokenPairIcon from "$client/components/TokenPairIcon/TokenPairIcon.svelte";
  import { Features } from "$shared/typings/YieldSource";
  import type { YieldSourceDisplayData } from "$shared/typings/Api";

  let { row }: { row: YieldSourceDisplayData } = $props();

  // Determine special characteristics - only show what's notable
  let specialFeatures = $derived(() => {
    const notable = [];
    
    if (row.features?.includes(Features.NO_IL)) notable.push('No IL');
    if (row.features?.includes(Features.GOVERNANCE)) notable.push('Governance');
    if (row.features?.includes(Features.INSTANT_LIQUIDITY)) notable.push('Instant Exit');
    if (row.features?.includes(Features.CURATED)) notable.push('Curated');
    if (row.features?.includes(Features.CONCENTRATED_LIQ)) notable.push('Concentrated');
    
    return notable;
  });
  
  let isComposite = $derived(row.isComposite || false);
  
  // Only show badges for notable characteristics
  let shouldShowSpecialBadge = $derived(specialFeatures().length > 0);
  
  // Primary special feature for main badge
  let primaryFeature = $derived(specialFeatures()[0] || null);
  
  // Badge styling based on feature type
  let badgeStyle = $derived(() => {
    if (row.features?.includes(Features.NO_IL)) return 'no-risk';
    if (row.features?.includes(Features.GOVERNANCE)) return 'governance';
    if (row.features?.includes(Features.CURATED)) return 'curated';
    return 'standard';
  });
</script>

<div class="yield-source-cell" class:has-special-features={shouldShowSpecialBadge}>
  <TokenPairIcon 
    tokens={row.tokens} 
    size="md" 
  />
  
  <div class="yield-source-info">
    <div class="name-row">
      <span class="yield-source-name" title={row.name}>
        {row.name}
      </span>
      
      <!-- Only show special feature badge if there are notable features -->
      {#if shouldShowSpecialBadge}
        <div class="feature-badge {badgeStyle}">
          <span class="feature-label">{primaryFeature}</span>
          {#if specialFeatures().length > 1}
            <span class="feature-count">+{specialFeatures().length - 1}</span>
          {/if}
        </div>
      {/if}

      <DappBadge
        dappIcon={row.dappIcon} 
        dappName={row.dapp}
        size="sm" 
      />
    </div>
    
    <div class="yield-details">
      <div class="yield-source-type">
        {row.type}
        <!-- {#if row.status === 'growing'}
          <span class="status-indicator growing">📈 Growing</span>
        {:else if row.status === 'volatile'}
          <span class="status-indicator volatile">📊 Volatile</span>
        {/if} -->
        
        <!-- Composite indicator -->
        {#if isComposite}
          <div class="composite-badge">
            <span class="composite-icon">⚡</span>
            <span class="composite-label">Multi-Source</span>
          </div>
        {/if}
      </div>
      
      <!-- Feature benefits - only show if there are special features -->
      {#if specialFeatures().length > 0}
        <div class="feature-benefits">
          <span class="benefit-preview">
            {specialFeatures().slice(0, 3).join(' • ')}
          </span>
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

  &.has-special-features {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(147, 51, 234, 0.03) 100%);
    border-left: 2px solid var(--blue-400);
  }

  &:hover {
    background: var(--gray-50);
    
    &.has-special-features {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(147, 51, 234, 0.06) 100%);
    }
  }
}

.yield-source-info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
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

// Feature badge with different styles based on feature type
.feature-badge {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  flex-shrink: 0;

  &.no-risk {
    background: linear-gradient(135deg, var(--green-100) 0%, var(--emerald-100) 100%);
    color: var(--green-700);
    border: 1px solid var(--green-200);
  }

  &.premium {
    background: linear-gradient(135deg, var(--blue-100) 0%, var(--purple-100) 100%);
    color: var(--blue-700);
    border: 1px solid var(--blue-200);
  }

  &.governance {
    background: linear-gradient(135deg, var(--purple-100) 0%, var(--pink-100) 100%);
    color: var(--purple-700);
    border: 1px solid var(--purple-200);
  }

  &.curated {
    background: linear-gradient(135deg, var(--amber-100) 0%, var(--yellow-100) 100%);
    color: var(--amber-700);
    border: 1px solid var(--amber-200);
  }

  .feature-label {
    font-size: 9px;
    line-height: 1;
  }

  .feature-count {
    font-size: 8px;
    opacity: 0.8;
  }
}

.composite-badge {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 1px 5px;
  border-radius: 8px;
  font-size: 9px;
  font-weight: 500;
  background: var(--indigo-100);
  color: var(--indigo-700);
  border: 1px solid var(--indigo-200);
  flex-shrink: 0;

  .composite-icon {
    font-size: 8px;
  }

  .composite-label {
    font-size: 8px;
  }
}

.yield-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.yield-source-type {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--gray-500);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-indicator {
  font-size: 10px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: normal;

  &.growing {
    color: var(--green-600);
  }

  &.volatile {
    color: var(--orange-600);
  }
}

.feature-benefits {
  font-size: 10px;
  color: var(--blue-600);
  font-weight: 500;
  opacity: 0.8;
}

.benefit-preview {
  color: var(--blue-700);
}

// Responsive adjustments
@media (max-width: 768px) {
  .yield-source-cell {
    gap: 8px;
  }
  
  .name-row {
    gap: 4px;
  }
  
  .yield-source-name {
    max-width: 120px;
    font-size: 13px;
  }
  
  .feature-badge,
  .composite-badge {
    padding: 1px 4px;
    
    .feature-label,
    .composite-label {
      font-size: 8px;
    }
  }
  
  .feature-benefits {
    font-size: 9px;
  }
}
</style>
