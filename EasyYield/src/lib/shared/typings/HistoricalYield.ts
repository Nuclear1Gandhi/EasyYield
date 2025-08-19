export type HistoricalYieldDoc = {
  yieldSourceId: string; // Reference to the yield source (e.g., address or custom id)
  apy: string; // The APY at this snapshot
  tvl: string; // The TVL at this time
  timestamp: Date; // When the snapshot was taken
};
