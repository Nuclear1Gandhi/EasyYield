<script lang="ts">
  import Icon from '@iconify/svelte';

  type Stat = {
    icon: string;
    label: string;
    value: string;
    isPrimary?: boolean;
  };

  type Props = {
    stats: Stat[];
  };

  let { stats }: Props = $props();
</script>

<section class="hero-stats">
  {#each stats as stat}
    <div class="stat-card {stat.isPrimary ? 'primary' : ''}">
      <div class="stat-icon">
        <Icon icon={stat.icon} width="24" height="24" />
      </div>
      <div class="stat-content">
        <h3>{stat.label}</h3>
        <div class="stat-value">{stat.value}</div>
      </div>
    </div>
  {/each}
</section>

<style lang="scss">
  .hero-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
    margin-bottom: 8px;
  }

  .stat-card {
    background: var(--surface-1);
    border: 1px solid var(--border-weak);
    border-radius: var(--radius);
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: border-color var(--dur-med) var(--easing-standard);

    &:hover {
      border-color: var(--border-strong);
    }

    &.primary {
      border-color: var(--primary);
      background: var(--primary-08);
    }

    .stat-icon {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border-radius: var(--radius);
      background: var(--surface-2);
      color: var(--primary);
    }

    .stat-content h3 {
      font-size: 14px;
      color: var(--gray-400);
      margin: 0 0 4px 0;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: var(--fg);
    }
  }
</style>
