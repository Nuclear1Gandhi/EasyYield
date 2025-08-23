<script lang="ts">
  import { Card, Button } from 'flowbite-svelte';
  import { StarOutline, ShareAllOutline, LinkOutline, FileCopyAltOutline, FileCopyOutline } from 'flowbite-svelte-icons';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';

  let { yieldSource, onAddToWatchlist, onShare }: { 
    yieldSource: YieldSourceDisplayData;
    onAddToWatchlist: () => void;
    onShare: () => void;
  } = $props();

  function handleDeposit() {
    // TODO: Integrate with Radix Connect
    console.log('Deposit to:', yieldSource.name);
  }

  function handleCopyAddress() {
    // TODO: Copy pool/contract address
    navigator.clipboard.writeText(yieldSource.id);
  }
</script>

<Card>
  <div class="action-header">
    <h3>Actions</h3>
  </div>
  
  <div class="action-buttons">
    <Button color="primary" class="w-full" onclick={handleDeposit}>
      <LinkOutline class="w-4 h-4 mr-2" />
      Deposit
    </Button>
    
    <Button color="alternative" class="w-full" onclick={onAddToWatchlist}>
      <StarOutline class="w-4 h-4 mr-2" />
      Add to Watchlist
    </Button>
    
    <Button color="alternative" class="w-full" onclick={handleCopyAddress}>
      <FileCopyOutline class="w-4 h-4 mr-2" />
      Copy Address
    </Button>
    
    <Button color="alternative" class="w-full" onclick={onShare}>
      <ShareAllOutline class="w-4 h-4 mr-2" />
      Share
    </Button>
  </div>
  
  <div class="external-links">
    <h4>External Resources</h4>
    <div class="links-grid">
      <a href="#" class="external-link">Website</a>
      <a href="#" class="external-link">Explorer</a>
      <a href="#" class="external-link">Audit</a>
      <a href="#" class="external-link">Docs</a>
    </div>
  </div>
</Card>

<style lang="scss">
  .action-header {
    margin-bottom: 16px;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      color: var(--text-primary);
    }
  }

  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  .external-links {
    h4 {
      font-size: 14px;
      font-weight: 600;
      margin: 0 0 12px 0;
      color: var(--text-secondary);
      text-transform: uppercase;
    }
  }

  .links-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .external-link {
    padding: 8px 12px;
    background: var(--surface-2);
    border: 1px solid var(--border-weak);
    border-radius: 6px;
    text-decoration: none;
    color: var(--text-primary);
    font-size: 14px;
    text-align: center;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--surface-3);
      border-color: var(--border-strong);
    }
  }
</style>
