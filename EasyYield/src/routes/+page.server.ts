import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, locals }) => {
  const res = await fetch('/api/v1/protected/protocols');
  if (!res.ok) throw new Error('Failed to load protocols');
  const protocols = await res.json();
  // const portfolio = await fetch('/api/portfolio/' + walletAddress);
  // const strategies = await fetch('/api/strategies');
  // const activity = await fetch('/api/activity');
  // Optional: Only load portfolio if wallet address provided
  // let portfolio = null;
  // const userAddress = locals.jwt?.address; // adjust path as per how you parse/store jwt in locals
  // if (userAddress) {
  //   const portfolioRes = await fetch(`/api/portfolio/${userAddress}`);
  //   portfolio = (await portfolioRes.ok) ? await portfolioRes.json() : null;
  // }

  return { protocols };
};
