<script lang="ts">
  import { Button, Spinner } from 'flowbite-svelte';
  import { ArrowRightOutline, WalletOutline  } from 'flowbite-svelte-icons';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';
  import { rdt, transactionState } from '$lib/stores';
  import { mintLsu } from '$client/methodCalls/mintLSU';
  import { stakeXrd } from '$client/methodCalls/stakeXrd';
  import { addLiquidity } from '$client/methodCalls/addLiquidity';
  import { YieldSourceType } from '$shared/typings/YieldSource';

  let { source }: { source: YieldSourceDisplayData } = $props();
  
  // Reactive state
  let isConnected = $derived(!!$rdt);
  let isProcessing = $derived($transactionState.isProcessing);

  async function handleStartEarning() {
    if (!isConnected) {
      // The wallet connection is handled automatically by the hook
      return;
    }

    // For MVP, use fixed amounts - later you can add amount input modals
    const defaultAmount = '10'; // 10 XRD default

    try {
      switch (source.type) {
        case YieldSourceType.VALIDATOR:
          await stakeXrd({
            validatorAddress: source.id,
            amount: defaultAmount
          });
          break;
        case YieldSourceType.LSU_POOL:
          await mintLsu({
            poolAddress: source.id,
            xrdAmount: defaultAmount
          });
          break;
        case YieldSourceType.DEX_PAIR:
          await addLiquidity({
            poolAddress: source.id,
            token1Amount: defaultAmount,
            token2Amount: defaultAmount, // This should be calculated based on pool ratio
            token1Address: 'resource_rdx1tknxxxxxxxxxradxrdxxxxxxxxx009923554798xxxxxxxxxradxrd', // XRD
            token2Address: 'resource_rdx1tkk83magp3gjyxrpskfsqwkg4g949rmcjee4tu2xmw93ltw2cz94sq' // Example token
          });
          break;
        default:
          console.log('Start earning with:', source.name);
      }
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  }

  function getButtonText(): string {
    if (isProcessing) return 'Processing...';
    if (!isConnected) return 'Connect Wallet';
    
    switch (source.type) {
      case YieldSourceType.VALIDATOR: return 'Stake XRD';
      case YieldSourceType.LSU_POOL: return 'Mint LSU';
      case YieldSourceType.DEX_PAIR: return 'Add Liquidity';
      default: return 'Start Earning';
    }
  }
</script>

<Button 
  color={!isConnected ? "alternative" : "primary"}
  size="sm" 
  onclick={handleStartEarning}
  class="start-earning-btn"
  disabled={isProcessing}
>
  {getButtonText()}
  {#if isProcessing}
    <Spinner class="w-3 h-3 ml-1" />
  {:else if !isConnected}
    <WalletOutline class="w-3 h-3 ml-1" />
  {:else}
    <ArrowRightOutline class="w-3 h-3 ml-1" />
  {/if}
</Button>

<style lang="scss">
  @use 'sass:map';
  @use '$client/styles/variables' as *;
  :global(.start-earning-btn) {
    white-space: nowrap;
    min-width: 120px;
    cursor: pointer;
    display: flex;
    justify-content: flex-end;
    width: 100%;
    color: $color-primary;
  }
</style>
