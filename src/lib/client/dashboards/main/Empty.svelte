<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Button } from 'flowbite-svelte';
  
  type Props = {
    title?: string;
    description?: string;
    actionText?: string;
    onAction?: () => void;
    icon?: string;
    loading?: boolean;
  };

  let {
    title = "No Yield Sources Found",
    description = "We couldn't find any yield opportunities matching your criteria. Try adjusting your filters or check back later as new protocols are added regularly.",
    actionText = "Refresh Data",
    onAction,
    icon = "tabler:chart-line",
    loading = false
  }: Props = $props();
</script>

<div class="empty-yield-state">
  <div class="empty-icon">
    <Icon {icon} width="64" />
  </div>
  
  <div class="empty-content">
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
  
  {#if onAction && actionText}
    <div class="empty-actions">
      <Button 
        color="primary" 
        class="gap-1"
        onclick={onAction}
        disabled={loading}
      >
        {#if loading}
          <Icon icon="tabler:loader-2" width="16" class="animate-spin" />
        {:else}
          <Icon icon="tabler:refresh" width="16" />
        {/if}
        {actionText}
      </Button>
    </div>
  {/if}
</div>

<style lang="scss">
  .empty-yield-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    padding: 48px 32px;
    text-align: center;
    color: var(--gray-400);
  }

  .empty-icon {
    opacity: 0.6;
    color: var(--gray-300);
  }

  .empty-content {
    max-width: 400px;
    
    h3 {
      margin: 0 0 12px 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--fg);
    }
    
    p {
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      color: var(--gray-400);
    }
  }

  .empty-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    justify-content: center;
  }

  // Add the spinner animation
  :global(.animate-spin) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
</style>
