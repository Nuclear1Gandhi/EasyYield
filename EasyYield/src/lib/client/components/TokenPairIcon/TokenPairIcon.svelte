<script lang="ts">
  interface Props {
    tokenIcons: string[];
    tokenSymbols: string[];
    size?: 'sm' | 'md' | 'lg';
  }
  
  let { tokenIcons, tokenSymbols, size = 'md' }: Props = $props();
  
  const sizeClasses = {
    sm: 'token-icon-sm',
    md: 'token-icon-md', 
    lg: 'token-icon-lg'
  };
  
  const maxVisible = 3; // Show max 3 tokens
  const visibleIcons = tokenIcons.slice(0, maxVisible);
  const hasMore = tokenIcons.length > maxVisible;
</script>

<div class="token-pair-icon {sizeClasses[size]}">
  {#each visibleIcons as iconUrl, index}
    <div class="token-icon" style="z-index: {visibleIcons.length - index}">
      {#if iconUrl}
        <img 
          src={iconUrl} 
          alt={tokenSymbols[index] || 'Token'} 
          onerror={function() {
            console.error('Error loading image', iconUrl)
            this.src = '/no-image-circle-min.png'
          }}
        />
      {:else}
        <div class="token-placeholder">
          {tokenSymbols[index]?.charAt(0) || '?'}
        </div>
      {/if}
    </div>
  {/each}
  
  {#if hasMore}
    <div class="token-more">
      +{tokenIcons.length - maxVisible}
    </div>
  {/if}
</div>

<style lang="scss">
.token-pair-icon {
  display: flex;
  align-items: center;
  
  .token-icon {
    position: relative;
    border-radius: 50%;
    border: 2px solid var(--surface-1);
    background: var(--surface-1);
    overflow: hidden;
    
    &:not(:first-child) {
      margin-left: -8px;
    }
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    
    .token-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      background: var(--gray-200);
      color: var(--gray-600);
      font-weight: 600;
      font-size: 0.7em;
    }
  }
  
  .token-more {
    margin-left: 4px;
    font-size: 0.75em;
    color: var(--gray-500);
    font-weight: 500;
  }
  
  &.token-icon-sm .token-icon {
    width: 20px;
    height: 20px;
  }
  
  &.token-icon-md .token-icon {
    width: 28px;
    height: 28px;
  }
  
  &.token-icon-lg .token-icon {
    width: 36px;
    height: 36px;
  }
}
</style>
