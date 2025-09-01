import type { RequestHandler } from '@sveltejs/kit';
import { verifyJWT } from '$server/auth/jwt';
import { JWT_SECRET } from '$env/static/private';

export const GET: RequestHandler = async ({ cookies }) => {
  const token = cookies.get(JWT_SECRET);
  if (!token || !verifyJWT(token)) {
    return new Response('Unauthorized', { status: 401 });
  }
  return new Response('Secret data', { status: 200 });
};
