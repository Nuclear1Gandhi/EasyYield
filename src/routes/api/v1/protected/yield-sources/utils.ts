import type { PoolInfoFungibleResource } from '$shared/typings/CaviarNine';
import BigNumber from 'bignumber.js';

export const getResourceRatio = (tokens: PoolInfoFungibleResource[]) => {
  const resourceA = tokens[0];
  const resourceB = tokens[1];

  const amountA = new BigNumber(resourceA.amount);
  const amountB = new BigNumber(resourceB.amount);

  // Total amount = A + B
  const totalAmount = amountA.plus(amountB);

  // Ratio of A to total (0.0 to 1.0)
  const ratioA = amountA.dividedBy(totalAmount);

  // Set minimum threshold - if ratio is extremely small, set to 0.01
  const minThreshold = new BigNumber(0.01);

  if (ratioA.lt(minThreshold)) {
    return minThreshold.toString(); // "0.01"
  }

  return ratioA.toFixed(2);
};
