<script lang="ts">
  import Icon  from '@iconify/svelte';
  import {  Input } from 'flowbite-svelte';
  import '$client/styles/app.scss'
  import { onMount } from 'svelte';
  import { useRadixAuth } from '$client/hooks/useRadixAuth';
  import { type NavKey } from '../Sidebar/Sidebar.svelte';

  type Props =  {  }
  let {  }: Props = $props()
  
  // Runes state

  // Iconify (Tabler set)
  const iMenu = 'tabler:menu-2';
  const iClose = 'tabler:x';
  const iSearch = 'tabler:search';

  onMount(() => {
    useRadixAuth();
  })

  let sidebarOpen = $state(false);
  let activeNav = $state<NavKey>('dashboard');

  function handleNavSelect(key: NavKey) {
    activeNav = key;
    sidebarOpen = false; // Close drawer after selection on mobile
    // Optionally, route here if needed
  }
</script>

<header class="app-header">
  <div class="brand">

    <button class="icon-btn" aria-label="Menu" onclick={() => (sidebarOpen = !sidebarOpen)}>
      {#if sidebarOpen}
        <Icon icon={iClose} width="20" height="20" />
      {:else}
        <Icon icon={iMenu} width="20" height="20" />
      {/if}
    </button>
    <img src="/logo.png" alt="logo" class="logo" aria-hidden="true" />
    <div class="name">EasyYield</div>
  </div>

  <div class="top-actions">
    <div class="search">
      <Input placeholder="Search yield sources...">
        <span slot="left">
          <Icon icon={iSearch} width="18" height="18" />
        </span>
      </Input>
    </div>
    
    <div class="right-actions">
    
      <radix-connect-button ></radix-connect-button>
    </div>
    <!-- <Button color="alternative">
      <Icon icon={iCog} width="18" height="18" class="mr-2" /> Settings
    </Button> -->
  </div>
</header>
<!-- Mobile Drawer sidebar -->
<!-- <Drawer   class="custom-drawer" open={sidebarOpen} onclose={() => (sidebarOpen = false)} >
  <Sidebar active={activeNav} mode='drawer' onNavSelect={handleNavSelect} />
</Drawer>

<Sidebar active={activeNav} onNavSelect={handleNavSelect} /> -->



<style lang="scss">
  @use '$client/styles/variables' as *;
  @use '$client/styles/mixins' as *;
  :global(.custom-drawer) {
    background: var(--surface-1) !important;
    border: none !important;
    box-shadow: var(--shadow-2) !important;
    padding: 0 !important;
  }

  :global(.custom-drawer > div) {
    padding: 0 !important;
    background: transparent !important;
  }
  /* Adjust this path alias to your project structure */
  .app-header {
    grid-area: header;
    position: sticky;
    top: 0;
    z-index: 40;
    background: var(--surface-1);
    border-bottom: 1px solid var(--border-weak);
    align-items: center;
    justify-content: space-between;
    display: flex;
    gap: 12px;
    padding: 10px 14px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 10px;

    .icon-btn {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: var(--radius);
      border: 1px solid transparent;
      background: transparent;
      color: var(--gray-300);
      transition:
        background var(--dur-med) var(--easing-standard),
        border-color var(--dur-med) var(--easing-standard),
        color var(--dur-med) var(--easing-standard);

      &:hover {
        background: var(--surface-2);
        border-color: var(--border-weak);
        color: var(--gray-100);
      }

      // Show hamburger only on mobile/tablet
      display: grid;
      @include respond-to(lg) {
        display: none;
      }
    }

    .logo {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      box-shadow: 0 1px 0 rgba(255,255,255,0.06) inset;
      position: relative;

   
    }

    .name {
      font-weight: 600;
      letter-spacing: 0.2px;
      color: var(--fg);
      font-size: 1.1rem;

      // Hide name on very small screens if needed
      @media (max-width: 480px) {
        display: none;
      }
    }
  }

  .top-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex: 1;
    justify-content: center;

    .search {
      width: 100%;
      max-width: 520px;

      // On mobile, reduce max-width
      @media (max-width: 768px) {
        max-width: 280px;
      }
    }
  }

  .right-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    justify-content: flex-end;

    // Stack on very small screens
    @media (max-width: 480px) {
      gap: 8px;
    }
  }
</style>
