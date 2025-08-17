export type HistoricalYieldDoc = {
  protocolId: string; // Reference to the protocol (e.g., address or custom id)
  apy: string; // The APY at this snapshot
  tvl: string; // The TVL at this time
  timestamp: Date; // When the snapshot was taken
};
