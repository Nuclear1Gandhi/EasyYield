<script lang="ts">
  import Main from '$client/dashboards/main/index.svelte'
  import { dashboardStore } from '$client/stores/dashboard';
  import { onMount } from 'svelte';
  import type { PageServerData } from './$types';
  let { data }: { data: PageServerData } = $props()
  // Load initial data
  dashboardStore.hydrate(data);
  onMount(() => {
    // Set up periodic refresh (every 5 minutes)
    const interval = setInterval(() => {
      dashboardStore.refreshAll();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  });
</script>
<Main></Main>