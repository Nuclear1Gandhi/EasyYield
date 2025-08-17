import type { RequestHandler } from '@sveltejs/kit';
import { JWT_KEY } from '$lib/constants';
import { verifyJWT } from '$server/auth/jwt';

export const GET: RequestHandler = async ({ cookies }) => {
  const token = cookies.get(JWT_KEY);
  if (!token || !verifyJWT(token)) {
    return new Response('Unauthorized', { status: 401 });
  }
  return new Response('Secret data', { status: 200 });
};