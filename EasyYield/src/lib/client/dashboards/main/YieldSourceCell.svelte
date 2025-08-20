<!-- src/client/components/YieldSourceCell.svelte -->
<script lang="ts">
  import DappBadge from "$client/components/DappBadge/DappBadge.svelte";
  import TokenPairIcon from "$client/components/TokenPairIcon/TokenPairIcon.svelte";
  import type { YieldSourceDisplayData } from "$shared/typings/Api";

  
  let { row }: { row: YieldSourceDisplayData } = $props();
</script>

<div class="yield-source-cell">
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
      <DappBadge
        dappIcon={row.dappIcon} 
        dappName={row.dappName}
        size="sm" 
      />
    </div>
    <div class="yield-source-type">
      <!-- {row.type} -->
    </div>
  </div>
</div>

<style lang="scss">
.yield-source-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.yield-source-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--fg);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.yield-source-type {
  font-size: 12px;
  color: var(--gray-400);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}
</style>
