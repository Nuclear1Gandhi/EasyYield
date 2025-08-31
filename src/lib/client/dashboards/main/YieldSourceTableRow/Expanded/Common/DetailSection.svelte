<script lang="ts">
  import type { Snippet } from 'svelte';

  type Props = {
    title: string;
    children: Snippet;
  };

  let { title, children }: Props = $props();
</script>

<div class="detail-section">
  <h4 class="section-title">{title}</h4>
  <div class="section-content">
    {@render children()}
  </div>
</div>

<style lang="scss">
  .detail-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--fg);
    margin: 0;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border-weak);
  }

  .section-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
</style>
