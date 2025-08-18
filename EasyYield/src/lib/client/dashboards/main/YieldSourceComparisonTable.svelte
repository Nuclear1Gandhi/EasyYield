<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { ProtocolDisplayData } from '$shared/typings/Api';

  type Props = {
    protocols: ProtocolDisplayData[]
  }
  
  let { protocols }: Props = $props()

  // Column sort
  let sortBy: keyof ProtocolDisplayData = $state('apy');
  let sortAsc = $state(false);
  let sortedProtocols: ProtocolDisplayData[] = $state(protocols);
  
  $effect(() => {
    sortedProtocols = [...protocols].sort((a, b) => {
     let aVal = a[sortBy];
     let bVal = b[sortBy];
     if (sortBy === 'apy' || sortBy === 'tvl' || sortBy === 'volatility') {
       aVal = parseFloat(aVal as string);
       bVal = parseFloat(bVal as string);
     }
     return sortAsc
       ? aVal! > bVal! ? 1 : -1
       : aVal! < bVal! ? 1 : -1;
   });
  })

  function doSort(field: keyof ProtocolDisplayData) {
    if (sortBy === field) sortAsc = !sortAsc;
    else {
      sortBy = field;
      sortAsc = false;
    }
  }
</script>

<div class="yield-table-container">
  <table class="yield-table">
    <thead>
      <tr>
        <th>Yield Source</th>
        <th onclick={() => doSort('apy')}>
          <div class="col-head">
            APY <Icon icon={sortBy === 'apy' ? (sortAsc ? 'tabler:chevron-up' : 'tabler:chevron-down') : ''} width="16"/>
          </div>
        </th>
        <th onclick={() => doSort('tvl')}>
          <div class="col-head">
            TVL <Icon icon={sortBy === 'tvl' ? (sortAsc ? 'tabler:chevron-up' : 'tabler:chevron-down') : ''} width="16"/>
          </div>
        </th>
        <th onclick={() => doSort('change')}>
          <div class="col-head">
            7d Δ <Icon icon={sortBy === 'change' ? (sortAsc ? 'tabler:chevron-up' : 'tabler:chevron-down') : ''} width="16"/>
          </div>
        </th>
        <th onclick={() => doSort('status')}>
          Status
        </th>
        <th onclick={() => doSort('volatility')}>
          Volatility
        </th>
        <th></th>
      </tr>
    </thead>
    <tbody>
      {#each sortedProtocols as p}
        <tr>
          <td>
            <div class="protocol-cell">
              <Icon icon={p.icon} width="22" class="protocol-icon" />
              <span>{p.name.slice(0, 10)}</span>
            </div>
          </td>
          <td><strong>{p.apy}%</strong></td>
          <td>{p.tvl}</td>
          <td class={p.change.startsWith('+') ? 'pos' : p.change.startsWith('-') ? 'neg' : ''}>{p.change}%</td>
          <td>
            <span class="status-badge {p.status}">
              {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
            </span>
          </td>
          <td>
            {p.volatility != null
              ? `${Number(p.volatility).toFixed(2)}%` 
              : '--'}
          </td>
          <td>
            <!-- (Optional) Link to protocol action; e.g. staking -->
            <a class="action-link" href={`/protocol/${p.id}`}>Details</a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style lang="scss">
.yield-table-container {
  overflow-x: auto;
  background: var(--surface-1);
  border-radius: var(--radius);
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  padding: 0;
  margin-bottom: 24px;
}

.col-head{
  display: flex;
  align-items: center;
  width: min-content;
  padding: 0;
  gap: 4px;
  margin: 0;
}

.yield-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 750px;

  th, td {
    padding: 12px 14px;
    align-items: center;
    text-align: left;
    white-space: nowrap;
  }
  th {
    font-size: 13px;
    color: var(--gray-400);
    user-select: none;
    cursor: pointer;
  }
  tbody tr {
    border-top: 1px solid var(--border-weak);
    &:hover {
      background: var(--surface-2);
    }
  }
  .protocol-cell {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
  }
  .protocol-icon {
    margin-right: 4px;
    color: var(--primary);
    filter: drop-shadow(0 1px 1px var(--primary-04));
  }
  .status-badge {
    display: inline-block;
    padding: 0.2em 0.7em;
    border-radius: 100px;
    font-size: 11px;
    text-transform: capitalize;
    color: var(--surface-1);
    &.healthy { background: var(--success); }
    &.stable { background: var(--primary); }
    &.volatile { background: var(--warning); }
  }
  .pos { color: var(--success); }
  .neg { color: var(--danger); }
  .action-link {
    color: var(--primary);
    font-weight: 500;
    font-size: 13px;
    text-decoration: underline;
    &:hover { color: var(--primary-hover);}
  }
}
</style>
