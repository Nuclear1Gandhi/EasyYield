import type { PoolInfoFungibleResource } from '$shared/typings/CaviarNine';
import BigNumber from 'bignumber.js';

export const getResourceRatio = (tokens: PoolInfoFungibleResource[]) => {
  const resourceA = tokens[0];
  const resourceB = tokens[1];
  const amountA = new BigNumber(resourceA.amount); // token A amount as string
  const decimalsA = resourceA.decimals; // number of decimals for token A

  const amountB = new BigNumber(resourceB.amount); // token B amount as string
  const decimalsB = resourceB.decimals; // number of decimals for token B

  // Convert to standard decimal values accounting for decimals
  const standardizedA = amountA.dividedBy(new BigNumber(10).pow(decimalsA));
  const standardizedB = amountB.dividedBy(new BigNumber(10).pow(decimalsB));

  // Ratio of A to B
  const ratioAtoB = standardizedA.dividedBy(standardizedB).times(10);

  return ratioAtoB;
};
