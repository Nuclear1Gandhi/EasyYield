<script lang="ts">
  import { onMount } from 'svelte';
  import { Alert, Button,  Spinner } from 'flowbite-svelte';
  import { ArrowLeftOutline } from 'flowbite-svelte-icons';
  import { yieldSourceDetailStore } from '$client/stores/yieldSourceDetail';
  import { page } from '$app/state';
  import YieldSourceHeader from '$client/dashboards/yieldSource/YieldSourceHeader.svelte';
  import YieldSourceCharts from '$client/dashboards/yieldSource/YieldSourceCharts.svelte';
  import YieldSourceMetricsTable from '$client/dashboards/yieldSource/YieldSourceMetricsTable.svelte';
  import ActionPanel from '$client/dashboards/yieldSource/ActionPanel.svelte';

  // Get yield source ID from URL
  let yieldSourceId = $state(page.params.yieldSourceId);
  
  // Subscribe to detail store
  let detailData = $derived($yieldSourceDetailStore);
  
  onMount(() => {
    if (yieldSourceId) {
      yieldSourceDetailStore.loadYieldSource(yieldSourceId);
    }
  });

  function handleBackToDashboard() {
    window.history.back();
  }

  function handleAddToWatchlist() {
    // TODO: Implement watchlist functionality
    console.log('Add to watchlist:', yieldSourceId);
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href);
    // TODO: Show toast notification
  }
</script>

<svelte:head>
  <title>{detailData.yieldSource?.displayName || 'Loading...'} - EasyYield</title>
</svelte:head>

<div class="yield-source-detail">
  <!-- Back Navigation -->
  <div class="back-nav">
    <Button onclick={handleBackToDashboard} color="alternative" size="sm">
      <ArrowLeftOutline class="w-4 h-4 mr-2" />
      Back to Dashboard
    </Button>
  </div>

  {#if detailData.loading}
    <div class="loading-state">
      <Spinner size="8" />
      <p>Loading yield source details...</p>
    </div>
  {:else if detailData.error}
    <Alert color="red">
      <span class="font-medium">Error loading details:</span>
      {detailData.error}
    </Alert>
  {:else if detailData.yieldSource}
    <!-- Header Section -->
    <YieldSourceHeader yieldSource={detailData.yieldSource} />

    <!-- Main Content Grid -->
    <div class="detail-grid">
      <!-- Charts Section -->
      <div class="charts-section">
        <YieldSourceCharts
          yieldSource={detailData.yieldSource}
          historicalData={detailData.historicalData}
        />
      </div>

      <!-- Metrics Table -->
      <div class="metrics-section">
        <YieldSourceMetricsTable yieldSource={detailData.yieldSource} />
      </div>
    </div>

    <!-- Secondary Content Grid -->
    <div class="secondary-grid">
      <!-- Protocol Information -->
      <div class="protocol-section">
        <!-- <ProtocolInformation yieldSource={detailData.yieldSource} /> -->
      </div>

      <!-- Action Panel -->
      <div class="action-section">
        <ActionPanel
          yieldSource={detailData.yieldSource}
          onAddToWatchlist={handleAddToWatchlist}
          onShare={handleShare}
        />
      </div>
    </div>

    <!-- Related Opportunities -->
    <!-- <RelatedOpportunities
      currentSource={detailData.yieldSource}
      relatedSources={detailData.relatedSources}
    /> -->
  {:else}
    <Alert color="yellow">
      Yield source not found.
    </Alert>
  {/if}
</div>

<style lang="scss">
  .yield-source-detail {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .back-nav {
    display: flex;
    align-items: center;
  }

  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 60px;
    color: var(--gray-400);
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;

    @media (max-width: 1024px) {
      grid-template-columns: 1fr;
    }
  }

  .secondary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
</style>
