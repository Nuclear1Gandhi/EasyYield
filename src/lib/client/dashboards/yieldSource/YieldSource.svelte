<script lang="ts">
  import { Badge, Card, Tooltip } from 'flowbite-svelte';
  import { formatLargeNumber } from '$client/utils/format';
  import type { YieldSourceDisplayData } from '$shared/typings/Api';

  let { yieldSource }: { yieldSource: YieldSourceDisplayData } = $props();

  // Vault categorization
  let hasVault = $derived(yieldSource.hasVault || false);
  let vaultCategory = $derived(yieldSource.vaultCategory || 'BASIC_DEX');
  let isPremiumVault = $derived(hasVault && vaultCategory === 'PREMIUM_VAULT');

  function getRiskColor(risk: string) {
    switch (risk) {
      case 'low': return 'green';
      case 'medium': return 'yellow';
      case 'high': return 'red';
      case 'mixed': return 'purple';
      case 'variable': return 'indigo';
      default: return 'gray';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'growing': return 'green';
      case 'stable': return 'blue';
      case 'volatile': return 'yellow';
      default: return 'gray';
    }
  }

  function getChangeColor(change: string) {
    if (change?.startsWith('+')) return 'text-green-600';
    if (change?.startsWith('-')) return 'text-red-600';
    return 'text-gray-600';
  }

  function getVaultBadgeColor(hasVault: boolean) {
    return hasVault ? 'blue' : 'gray';
  }
</script>

<Card class={`yield-source-header ${isPremiumVault ? 'premium-vault' :'' }`}>
  <div class="header-content">
    <!-- Mobile-First Title Section -->
    <div class="title-section">
      <div class="title-row">
        <div class="icon-group">
          {#if yieldSource.dappIcon}
            <img src={yieldSource.dappIcon} alt={yieldSource.dappName} class="dapp-icon" />
          {/if}
          <div class="token-icons">
            {#each yieldSource.tokenIcons as icon, i}
              <img src={icon} alt={yieldSource.tokenSymbols[i]} class="token-icon" />
            {/each}
          </div>
        </div>
        
        <div class="title-info">
          <h1>{yieldSource.displayName || yieldSource.name}</h1>
          <p class="protocol-name">
            {yieldSource.dappName} • {yieldSource.type.replace('_', ' ')}
          </p>
        </div>
      </div>

      <!-- Vault Status & Badges -->
      <div class="badges-section">
        <!-- Vault Category Badge -->
        <Badge color={getVaultBadgeColor(hasVault)} class="vault-badge">
          {hasVault ? '🏦 Premium Vault' : '💧 Basic Pool'}
        </Badge>
        
        {#if yieldSource.isComposite}
          <Badge color="purple" size="small">Multi-Source</Badge>
        {/if}
        
        {#if yieldSource.riskProfile}
          <Badge color={getRiskColor(yieldSource.riskProfile)} size="small">
            {yieldSource.riskProfile} Risk
          </Badge>
        {/if}
        
        <Badge color={getStatusColor(yieldSource.status)}>
          {yieldSource.status.charAt(0).toUpperCase() + yieldSource.status.slice(1)}
        </Badge>
      </div>
    </div>

    <!-- Premium Vault Benefits (Mobile Optimized) -->
    {#if isPremiumVault}
      <div class="vault-benefits">
        <div class="benefits-header">
          <span class="benefits-title">Premium Benefits</span>
        </div>
        <div class="benefits-list">
          <span class="benefit-item">Protocol Revenue Sharing</span>
          <span class="benefit-item">Enhanced APY</span>
          <span class="benefit-item">Governance Rewards</span>
        </div>
      </div>
    {/if}

    <!-- Metrics Grid (Mobile Responsive) -->
    <div class="metrics-grid">
      <div class="metric primary-metric">
        <span class="metric-label">Current APY</span>
        <span class="metric-value primary">{yieldSource.apy}%</span>
        {#if yieldSource.isComposite}
          <Tooltip>
            Combined APY from all active yield sources. For a breakdown, see below.
          </Tooltip>
        {/if}
      </div>
      
      <div class="metric">
        <span class="metric-label">7-Day Avg</span>
        <span class="metric-value">{yieldSource.apy7dAvg || '--'}%</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">TVL</span>
        <span class="metric-value">{formatLargeNumber(yieldSource.tvl)}</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">7-Day Change</span>
        <span class="metric-value {getChangeColor(yieldSource.change)}">{yieldSource.change || '--'}%</span>
      </div>
    </div>

    <!-- Yield Sources Breakdown (Mobile Optimized) -->
    {#if yieldSource.isComposite && yieldSource.yieldSubSources && yieldSource.yieldSubSources.length > 0}
      <div class="yield-breakdown">
        <h3>Yield Sources Breakdown</h3>
        <div class="breakdown-grid">
          {#each yieldSource.yieldSubSources as sub}
            <div class="breakdown-item" class:inactive={!sub.isActive}>
              <div class="breakdown-main">
                <span class="breakdown-type">{sub.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                <span class="breakdown-apy">{sub.apy}%</span>
              </div>
              <div class="breakdown-badges">
                <Badge color={getRiskColor(sub.risk)} size="small">{sub.risk}</Badge>
                {#if !sub.isActive}
                  <Badge color="gray" size="small">Inactive</Badge>
                {/if}
              </div>
              {#if sub.description}
                <p class="breakdown-description">{sub.description}</p>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</Card>

<style lang="scss">
  .yield-source-header {
    &.premium-vault {
      border-left: 4px solid var(--blue-500);
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(147, 51, 234, 0.03) 100%);
    }
  }

  .header-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .title-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .title-row {
    display: flex;
    align-items: flex-start;
    gap: 16px;
  }

  .icon-group {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;

    .dapp-icon {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      border: 2px solid var(--border-weak);
    }

    .token-icons {
      display: flex;
      gap: -8px; // Overlap slightly
      
      .token-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid white;
        background: white;
        
        &:not(:first-child) {
          margin-left: -8px;
        }
      }
    }
  }

  .title-info {
    flex: 1;
    min-width: 0;

    h1 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: var(--text-primary);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .protocol-name {
      font-size: 14px;
      color: var(--text-secondary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
  }

  .badges-section {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;

    :global(.vault-badge) {
      font-weight: 600;
      font-size: 11px;
    }
  }

  .vault-benefits {
    background: linear-gradient(135deg, var(--blue-50) 0%, var(--purple-50) 100%);
    border: 1px solid var(--blue-200);
    border-radius: 8px;
    padding: 12px;

    .benefits-header {
      margin-bottom: 8px;
      
      .benefits-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--blue-700);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .benefits-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .benefit-item {
        font-size: 12px;
        color: var(--blue-600);
        background: white;
        padding: 4px 8px;
        border-radius: 12px;
        border: 1px solid var(--blue-200);
        font-weight: 500;
      }
    }
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;

    .metric {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px;
      background: var(--bg-surface);
      border-radius: 8px;
      border: 1px solid var(--border-weak);

      &.primary-metric {
        background: linear-gradient(135deg, var(--primary-50) 0%, var(--blue-50) 100%);
        border-color: var(--primary-200);
      }

      .metric-label {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .metric-value {
        font-size: 18px;
        font-weight: 700;
        color: var(--text-primary);

        &.primary {
          color: var(--primary-600);
          font-size: 22px;
        }
      }
    }
  }

  .yield-breakdown {
    border-top: 1px solid var(--border-weak);
    padding-top: 20px;

    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 0 0 16px 0;
      color: var(--text-primary);
    }
  }

  .breakdown-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .breakdown-item {
    padding: 16px;
    background: var(--bg-surface);
    border-radius: 8px;
    border: 1px solid var(--border-weak);

    &.inactive {
      opacity: 0.6;
      background: var(--gray-50);
    }

    .breakdown-main {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;

      .breakdown-type {
        font-size: 14px;
        font-weight: 600;
        color: var(--text-primary);
      }

      .breakdown-apy {
        font-size: 16px;
        font-weight: 700;
        color: var(--primary-600);
      }
    }

    .breakdown-badges {
      display: flex;
      gap: 6px;
      margin-bottom: 8px;
    }

    .breakdown-description {
      font-size: 12px;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.4;
    }
  }

  // Mobile Optimizations
  @media (max-width: 768px) {
    .title-row {
      gap: 12px;
    }

    .icon-group {
      .dapp-icon {
        width: 32px;
        height: 32px;
      }
      
      .token-icon {
        width: 28px;
        height: 28px;
      }
    }

    .title-info h1 {
      font-size: 18px;
    }

    .metrics-grid {
      grid-template-columns: 1fr;
      gap: 12px;

      .primary-metric {
        order: -1; // Always show primary APY first on mobile
      }

      .metric {
        padding: 16px;
        text-align: center;

        .metric-value {
          font-size: 20px;
          
          &.primary {
            font-size: 28px;
          }
        }
      }
    }

    .breakdown-item {
      padding: 12px;
      
      .breakdown-main {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        
        .breakdown-apy {
          align-self: flex-end;
        }
      }
    }

    .vault-benefits {
      padding: 10px;
      
      .benefits-list {
        gap: 6px;
        
        .benefit-item {
          font-size: 11px;
          padding: 3px 6px;
        }
      }
    }
  }

  // Large Mobile (up to tablet)
  @media (min-width: 769px) and (max-width: 1024px) {
    .metrics-grid {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .breakdown-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }
  }

  // Desktop
  @media (min-width: 1025px) {
    .metrics-grid {
      grid-template-columns: repeat(4, 1fr);
    }
    
    .breakdown-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }
    
    .breakdown-item {
      .breakdown-main {
        margin-bottom: 12px;
      }
    }
  }
</style>
