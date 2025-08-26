<script lang="ts">
  import type { PoolInfoFungibleResource } from "$shared/typings/CaviarNine";
  import { BigNumber } from "bignumber.js";

  type Props = { ratio: string; tokens: PoolInfoFungibleResource[] };

  let { ratio, tokens }: Props = $props();

  const tokenA = tokens[0];
  const tokenB = tokens[1];

  const percentageA = BigNumber(ratio).multipliedBy(100).toFixed(1);
  const percentageB = BigNumber(100).minus(percentageA).toFixed(1);
</script>

<div class="detail-item">
  <span class="label">Pool Ratio</span>
  <div class="value">
    <div class="ratio-text">
      <span>{percentageA}% {tokenA.symbol}</span>  <span>{percentageB}% {tokenB.symbol}</span></div>
    <div class="ratio-bar-container">
      <div class="ratio-bar">
        <div class="segment segment-a" style="width: {percentageA}%"></div>
        <div class="segment segment-b" style="width: {percentageB}%"></div>
      </div>
      <div class="bar-glow"></div>
    </div>
  </div>
</div>

<style lang="scss">
  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background: var(--surface-1);
    border-radius: 6px;
  }

  .label {
    font-size: 12px;
    color: var(--gray-400);
    font-weight: 500;
  }

  .value {
    font-size: 14px;
    font-weight: 600;
    color: var(--fg);
  }

  .ratio-text {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .ratio-bar-container {
    position: relative;
    width: 100%;
  }

  .ratio-bar {
    display: flex;
    height: 12px;
    border-radius: 2px;
    overflow: hidden;
    background: linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%);
    border: 1px solid #2a2a2a;
    box-shadow: 
      inset 0 1px 3px rgba(0, 0, 0, 0.6),
      0 1px 0 rgba(255, 255, 255, 0.1);
  }

  .segment {
    height: 100%;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, transparent 100%);
      pointer-events: none;
    }
  }

  .segment-a {
    background: linear-gradient(180deg, #4a9eff 0%, #1e7ce8 50%, #0066cc 100%);
    box-shadow: inset 1px 0 0 rgba(255, 255, 255, 0.2);
  }

  .segment-b {
    background: linear-gradient(180deg, #8a63d2 0%, #6c45ce 50%, #5a38b8 100%);
    box-shadow: inset -1px 0 0 rgba(255, 255, 255, 0.2);
  }

  .bar-glow {
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(90deg, 
      rgba(74, 158, 255, 0.3) 0%, 
      rgba(74, 158, 255, 0.3) var(--percentage-a, 50)%, 
      rgba(138, 99, 210, 0.3) var(--percentage-a, 50)%, 
      rgba(138, 99, 210, 0.3) 100%
    );
    border-radius: 4px;
    filter: blur(4px);
    opacity: 0.6;
    z-index: -1;
  }
</style>
