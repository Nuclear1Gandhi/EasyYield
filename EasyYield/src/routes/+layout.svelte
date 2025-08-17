<script lang="ts">
  import { useRadixAuth } from "$client/hooks/useRadixAuth";
  import { onMount } from "svelte";
  import Nav from "./Nav.svelte";
  onMount(() => {
    useRadixAuth();
  });
</script>

<Nav />

<main>
  <slot />
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5rem;
    padding: 5rem 1rem;
  }
</style>
