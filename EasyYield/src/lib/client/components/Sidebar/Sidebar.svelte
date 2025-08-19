<script lang="ts">
  import Icon from '@iconify/svelte';

  export type NavKey =
    | 'dashboard'
    | 'wallet'
    | 'yield_sources'
    | 'yields'
    | 'settings';

  type Props = {
    active: NavKey;
    onNavSelect?: (key: NavKey) => void;
    mode?: 'sidebar' | 'drawer';
  };

  let { active, onNavSelect, mode = 'sidebar' }: Props = $props();

  const navItems: { key: NavKey; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'tabler:layout-dashboard' },
    { key: 'wallet', label: 'Wallet', icon: 'tabler:wallet' },
    { key: 'yield_sources', label: 'Yield Sources', icon: 'tabler:plug' },
    { key: 'yields', label: 'Yields', icon: 'tabler:chart-bar' },
    { key: 'settings', label: 'Settings', icon: 'tabler:settings' }
  ];

  function select(key: NavKey) {
    onNavSelect?.(key);
  }
</script>

<aside class="app-sidebar" class:drawer-mode={mode === 'drawer'} aria-label="Sidebar navigation">
  {#each navItems as item}
    <button
      class="nav-item {active === item.key ? 'active' : ''}"
      type="button"
      aria-current={active === item.key ? 'page' : undefined}
      on:click={() => select(item.key)}
    >
      <Icon icon={item.icon} width="24" height="24" class="nav-icon" aria-hidden="true" />
      <span class="nav-label">{item.label}</span>
    </button>
  {/each}
</aside>

<style lang="scss">
  .app-sidebar {
    width: 72px;
    min-width: 72px;
    background: var(--surface-1);
    border-right: 1px solid var(--border-weak);
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    position: sticky;
    top: 52px;
    height: calc(100dvh - 52px);

    @media (min-width: 1024px) {
      width: 220px;
      min-width: 220px;
      .nav-label {
        display: inline;
      }
    }
    @media (max-width: 1023px) {
      .nav-label {
        display: none;
      }
    }
  }

.app-sidebar {
  width: 72px;
  background: var(--surface-1);
  border-right: 1px solid var(--border-weak);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  height: 100dvh;
  min-width: 72px;

  .nav-label {
    display: none;
  }

  @media (min-width: 1024px) {
    width: 220px;
    min-width: 220px;
    .nav-label {
      display: inline;
    }
  }

  &.drawer-mode {
    width: 100%;
    min-width: unset;
    height: auto;
    padding: 18px 0 18px 0;
    border-right: none;
    .nav-label {
      display: inline;
    }
    .nav-item {
      width: 100%;
      font-size: 1.15rem;
      padding: 18px 1.5rem;
      justify-content: flex-start;
      border-radius: 0;
      border-left: 0;
    }
  }
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 12px;
  border-radius: var(--radius);
  color: var(--fg);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  width: 100%;
  transition:
    background var(--dur-med) var(--easing-standard),
    border-color var(--dur-med) var(--easing-standard);

  &:hover {
    background: var(--surface-2);
    border-color: var(--border-weak);
  }

  &.active {
    background: var(--surface-2);
    border-left: 3px solid var(--primary);
    border-color: var(--border-strong);

    .nav-icon {
      color: var(--primary);
    }
  }

  .nav-icon {
    color: var(--gray-400);
    transition: color var(--dur-med) var(--easing-standard);
  }
}
</style>
