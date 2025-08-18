<script lang="ts">
  import { Badge, Button } from 'flowbite-svelte';

  type Strategy = {
    type: string;
    apy: string;
    risk: string;
    allocation: { xrd: number; caviarnine: number; ociswap: number };
    color: 'success' | 'primary' | 'warning';
  };

  type Props = {
    strategies: Strategy[];
    onApplyStrategy?: (strategy: Strategy) => void;
  };

  let { strategies, onApplyStrategy }: Props = $props();
</script>

<section class="strategy-section">
  <h2>Recommended Strategies</h2>
  <div class="strategy-cards">
    {#each strategies as strategy}
      <div class="strategy-card">
        <div class="strategy-header">
          <h3>{strategy.type}</h3>
          <Badge color={strategy.color}>{strategy.risk} Risk</Badge>
        </div>
        
        <div class="strategy-apy">
          <span class="apy-label">Expected APY</span>
          <span class="apy-value">{strategy.apy}%</span>
        </div>

        <div class="allocation-chart">
          <div class="allocation-bar">
            <div class="allocation-segment xrd" style="width: {strategy.allocation.xrd}%"></div>
            <div class="allocation-segment caviarnine" style="width: {strategy.allocation.caviarnine}%"></div>
            <div class="allocation-segment ociswap" style="width: {strategy.allocation.ociswap}%"></div>
          </div>
          <div class="allocation-legend">
            <span><span class="legend-dot xrd"></span>XRD {strategy.allocation.xrd}%</span>
            <span><span class="legend-dot caviarnine"></span>CaviarNine {strategy.allocation.caviarnine}%</span>
            <span><span class="legend-dot ociswap"></span>Ociswap {strategy.allocation.ociswap}%</span>
          </div>
        </div>

        <Button 
          size="sm" 
          color="primary" 
          class="w-full"
          on:click={() => onApplyStrategy?.(strategy)}
        >
          Apply Strategy
        </Button>
      </div>
    {/each}
  </div>
</section>

<style lang="scss">
  .strategy-section h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--fg);
  }

  .strategy-cards {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .strategy-card {
    background: var(--surface-1);
    border: 1px solid var(--border-weak);
    border-radius: var(--radius);
    padding: 20px;
  }

  .strategy-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }
  }

  .strategy-apy {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .apy-label {
      font-size: 14px;
      color: var(--gray-400);
    }

    .apy-value {
      font-size: 20px;
      font-weight: 600;
      color: var(--success);
    }
  }

  .allocation-chart {
    margin-bottom: 16px;
  }

  .allocation-bar {
    display: flex;
    height: 8px;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 8px;
  }

  .allocation-segment {
    &.xrd { background: var(--primary); }
    &.caviarnine { background: var(--secondary); }
    &.ociswap { background: var(--warning); }
  }

  .allocation-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    font-size: 12px;

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      
      &.xrd { background: var(--primary); }
      &.caviarnine { background: var(--secondary); }
      &.ociswap { background: var(--warning); }
    }
  }
</style>
