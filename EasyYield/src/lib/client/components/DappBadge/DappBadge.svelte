<!-- src/lib/components/DappBadge.svelte -->
<script lang="ts">
  interface Props {
    dappIcon?: string;
    dappName?: string;
    size?: 'sm' | 'md' | 'lg';
  }
  
  let { dappIcon, dappName, size = 'md' }: Props = $props();
  
  const sizeClasses = {
    sm: 'dapp-badge-sm',
    md: 'dapp-badge-md',
    lg: 'dapp-badge-lg'
  };
</script>

<div class="dapp-badge {sizeClasses[size]}" title={dappName}>
  {#if dappIcon}
    <img 
      src={dappIcon} 
      alt={dappName || 'DApp'}
      onerror={function() {
        this.src = '/no-image-circle-min.png'
      }}
    />
  {:else}
    <div class="dapp-placeholder">
      {dappName?.charAt(0) || 'D'}
    </div>
  {/if}
</div>

<style lang="scss">
.dapp-badge {
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--surface-1);
  overflow: hidden;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .dapp-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    background: var(--primary-50);
    color: var(--primary);
    font-weight: 600;
  }
  
  &.dapp-badge-sm {
    width: 16px;
    height: 16px;
    
    .dapp-placeholder {
      font-size: 10px;
    }
  }
  
  &.dapp-badge-md {
    width: 20px;
    height: 20px;
    
    .dapp-placeholder {
      font-size: 12px;
    }
  }
  
  &.dapp-badge-lg {
    width: 24px;
    height: 24px;
    
    .dapp-placeholder {
      font-size: 14px;
    }
  }
}
</style>
