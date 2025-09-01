<script lang="ts">
  type Props = {
    label: string;
    value: string;
    highlight?: boolean;
  };

  let { label, value, highlight = false }: Props = $props();
</script>

<div class="detail-item" class:highlight>
  <span class="label">{label}</span>
  <span class="value">{value}</span>
</div>

<style lang="scss">
  .detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    background: var(--surface-1);
    border-radius: 6px;

    &.highlight {
      background: var(--primary-50);
      border: 1px solid var(--primary-200);
    }
  }

  .label {
    font-size: 12px;
    color: var(--gray-400);
    font-weight: 500;
  }

  .value {
    font-size: 14px;
    font-weight: 600;
    color: var(--detail-color, --fg);
  }
</style>
