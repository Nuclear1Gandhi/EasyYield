import BigNumber from 'bignumber.js';

export type HistoricalYieldData = {
  apy: string;
  tvl: string;
  timestamp: Date;
};

export type ComputedProtocolMetrics = {
  apy7dAvg: string;
  apyStd7d: string;
  tvlChange7d: string;
};

export function computeProtocolMetrics(
  history: HistoricalYieldData[]
): ComputedProtocolMetrics | null {
  if (!history.length) return null;

  // 7d avg APY
  const sumApy = history.reduce(
    (acc, h) => acc.plus(new BigNumber(h.apy)),
    new BigNumber(0)
  );
  const apy7dAvg = sumApy.dividedBy(history.length);

  // Volatility (std dev)
  const mean = apy7dAvg;
  const variance = history
    .reduce(
      (acc, h) => acc.plus(new BigNumber(h.apy).minus(mean).pow(2)),
      new BigNumber(0)
    )
    .dividedBy(history.length);
  const apyStd7d = variance.sqrt();

  // TVL change (7d)
  const sorted = history
    .slice()
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const oldest = sorted[0];
  const latest = sorted[sorted.length - 1];
  const tvlChange7d =
    oldest && latest && !new BigNumber(oldest.tvl).isZero()
      ? new BigNumber(latest.tvl)
          .minus(new BigNumber(oldest.tvl))
          .dividedBy(new BigNumber(oldest.tvl))
          .multipliedBy(100)
      : new BigNumber(0);

  return {
    apy7dAvg: apy7dAvg.toFixed(),
    apyStd7d: apyStd7d.toFixed(),
    tvlChange7d: tvlChange7d.toFixed(),
  };
}
