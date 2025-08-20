<script lang="ts">
  import { Card } from 'flowbite-svelte';
  import { onMount } from 'svelte';
  import type { YieldSourceDisplayData, YieldSourceHistoricalData } from '$shared/typings/Api';
  
  let { yieldSource, historicalData }: { 
    yieldSource: YieldSourceDisplayData;
    historicalData: YieldSourceHistoricalData[] | null;
  } = $props();

  let apyChartCanvas: HTMLCanvasElement;
  let tvlChartCanvas: HTMLCanvasElement;
  let chartJs: any = $state(undefined);

  onMount(async () => {
    // Dynamically import Chart.js to avoid SSR issues
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);
    chartJs = Chart;
    
    if (historicalData && historicalData.length > 0) {
      createApyChart();
      createTvlChart();
    }
  });

  function createApyChart() {
    if (!historicalData || !apyChartCanvas) return;

    const ctx = apyChartCanvas.getContext('2d');
    if (!ctx) return;

    new chartJs(ctx, {
      type: 'line',
      data: {
        labels: historicalData.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [
          {
            label: 'APY (%)',
            data: historicalData.map(d => parseFloat(d.apy)),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'APY History (30 Days)'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              callback: function(value: any) {
                return value + '%';
              }
            }
          }
        }
      }
    });
  }

  function createTvlChart() {
    if (!historicalData || !tvlChartCanvas) return;

    const ctx = tvlChartCanvas.getContext('2d');
    if (!ctx) return;

    new chartJs(ctx, {
      type: 'line',
      data: {
        labels: historicalData.map(d => new Date(d.date).toLocaleDateString()),
        datasets: [
          {
            label: 'TVL',
            data: historicalData.map(d => parseFloat(d.tvl)),
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: 'TVL History (30 Days)'
          },
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value: any) {
                return new Intl.NumberFormat('en-US', {
                  notation: 'compact',
                  compactDisplay: 'short'
                }).format(value);
              }
            }
          }
        }
      }
    });
  }
</script>

<Card class="charts-container">
  <div class="charts-grid">
    <div class="chart-item">
      <canvas bind:this={apyChartCanvas} class="chart-canvas"></canvas>
    </div>
    
    <div class="chart-item">
      <canvas bind:this={tvlChartCanvas} class="chart-canvas"></canvas>
    </div>
  </div>
  
  {#if !historicalData || historicalData.length === 0}
    <div class="no-data">
      <p>Historical data not available</p>
    </div>
  {/if}
</Card>

<style lang="scss">
  .charts-grid {
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: 20px;
    height: 500px;
  }

  .chart-item {
    height: 240px;
    position: relative;
  }

  :global(.chart-canvas) {
    width: 100% !important;
    height: 100% !important;
  }

  .no-data {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 200px;
    color: var(--text-secondary);
  }

  @media (max-width: 768px) {
    .charts-grid {
      height: 600px;
    }
    
    .chart-item {
      height: 280px;
    }
  }
</style>
