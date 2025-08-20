<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { ArrowRightOutline, LinkBreakOutline } from 'flowbite-svelte-icons';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';

  let { source }: { 
    source: YieldSourceDisplayData;
  } = $props();

  // let walletState = $derived($radixConnectStore);

  async function onStartEarning() {
    // // First ensure wallet is connected
    // if (!walletState.isConnected) {
    //   await radixConnectStore.connectWallet();
    //   return;
    // }

    // // Route to appropriate earning flow based on source type
    // switch (source.type) {
    //   case 'xrd-staking':
    //     await handleXrdStaking();
    //     break;
    //   case 'lsu':
    //     await handleLsuMinting();
    //     break;
    //   case 'dex':
    //     await handleLiquidityProvision();
    //     break;
    //   default:
    //     console.log('Start earning with:', source.name);
    // }
  }

  function getButtonText(sourceType: string, dappName?: string): string {
    switch (sourceType) {
      case 'xrd-staking':
        return 'Stake XRD';
      case 'lsu':
        return 'Get LSU';
      case 'dex':
        return 'Add Liquidity';
      default:
        return 'Start Earning';
    }
  }

  function isExternal(sourceType: string): boolean {
    return sourceType !== 'strategy'; // Most will be external links
  }
</script>

<Button 
  color="primary" 
  size="sm" 
  onclick={onStartEarning}
  class="start-earning-btn"
>
  {getButtonText(source.type, source.dappName)}
  {#if isExternal(source.type)}
    <LinkBreakOutline class="w-3 h-3 ml-1" />
  {:else}
    <ArrowRightOutline class="w-3 h-3 ml-1" />
  {/if}
</Button>

<style lang="scss">
  :global(.start-earning-btn) {
    white-space: nowrap;
    min-width: 100px;
  }
</style>
