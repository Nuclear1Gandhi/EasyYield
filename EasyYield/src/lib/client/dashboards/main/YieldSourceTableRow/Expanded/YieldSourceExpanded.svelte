<script lang="ts">
  import type { YieldSourceDisplayData } from '$shared/typings/Api';
  import { Protocols, YieldSourceType } from '$shared/typings/YieldSource';
  
  // Import the fallback components
  import LSUPoolDetails from './LSUPoolDetails.svelte';
  import GenericYieldDetails from './Staking/GenericYieldDetails.svelte';
  import ValidatorDetails from './Staking/ValidatorDetails.svelte';

  type Props = {
    yieldSource: YieldSourceDisplayData;
  };

  let { yieldSource }: Props = $props();

  function getDetailsComponent() {
    switch (yieldSource.type) {
      case YieldSourceType.LSU_POOL:
        return LSUPoolDetails;
      case YieldSourceType.VALIDATOR:
        return ValidatorDetails;
      default:
        return GenericYieldDetails;
    }
  }
</script>

<div class="yield-source-expanded">
  {#if yieldSource.type === YieldSourceType.DEX_PAIR}
    {#if yieldSource.protocolMetadata?.protocol === Protocols.CAVIARNINE}
      {#await import('./Dex/CaviarNineDexDetails.svelte') then module}
        <svelte:component this={module.default} {yieldSource} />
      {/await}
    {:else}
      {#await import('./Dex/OciswapDexDetails.svelte') then module}
        <svelte:component this={module.default} {yieldSource} />
      {/await}
    {/if}
  {:else}
    {@const Component = getDetailsComponent()}
    <Component {yieldSource} />
  {/if}
</div>

<style lang="scss">
  .yield-source-expanded {
    padding: 20px;
    background: var(--surface-2);
    border-radius: 8px;
    margin: 8px 0;
  }
</style>
