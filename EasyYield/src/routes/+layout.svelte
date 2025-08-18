<script lang="ts">
  import '$client/styles/app.scss'
  import Header from '$client/components/Header/Header.svelte';

</script>

<div class="app-shell">
  <Header ></Header>

  <!-- Main content + right panel -->
  <main class="app-main">
    <section class="content">
      <slot />
    </section>
  </main>
</div>

<style lang="scss">
  @use '$client/styles/variables' as *;

  .app-shell {
    display: grid;
    grid-template-areas:
      "header header"
      "sidebar main"
      "drawer drawer";
    grid-template-columns: 280px 1fr;
    grid-template-rows: auto 1fr auto;
    min-height: 100dvh;
    background: var(--bg);

    @media (max-width: 1024px) {
      grid-template-columns: 0 1fr; /* collapsed sidebar on smaller screens */
    }
  }

  
  .app-main {
    grid-area: main;
    padding: 14px;
    display: grid;
    grid-template-columns: 1fr; /* content + right panel */
    gap: 14px;

    @media (max-width: 1280px) {
      grid-template-columns: 1fr; /* stack on narrower screens */
    }
  }

  .content {
    min-width: 0;
  }

  .right-panel {
    position: sticky;
    top: 64px;
    align-self: start;
    height: fit-content;
    background: var(--surface-1);
    border: 1px solid var(--border-weak);
    border-radius: var(--radius);
    box-shadow: var(--shadow-1);
    padding: 12px;
  }
</style>
