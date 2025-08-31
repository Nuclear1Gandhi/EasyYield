<script lang="ts">
  type Activity = {
    yieldSource: string;
    action: string;
    value: string;
    time: string;
  };

  type Props = {
    activities: Activity[];
  };

  let { activities }: Props = $props();
</script>

<section class="activity-section">
  <h2>Recent Activity</h2>
  <div class="activity-feed">
    {#each activities as activity}
      <div class="activity-item">
        <div class="activity-content">
          <strong>{activity.yieldSource}</strong>
          <span>{activity.action}</span>
          <span class="activity-value">{activity.value}</span>
        </div>
        <span class="activity-time">{activity.time}</span>
      </div>
    {/each}
  </div>
</section>

<style lang="scss">
  .activity-section h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
    color: var(--fg);
  }

  .activity-feed {
    background: var(--surface-1);
    border: 1px solid var(--border-weak);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .activity-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-weak);

    &:last-child {
      border-bottom: none;
    }

    .activity-content {
      display: flex;
      flex-direction: column;
      gap: 4px;

      strong {
        font-weight: 600;
      }

      .activity-value {
        font-size: 14px;
        color: var(--primary);
        font-weight: 500;
      }
    }

    .activity-time {
      font-size: 12px;
      color: var(--gray-400);
    }
  }
</style>
