// src/hooks.server.ts
import { verifyJWT } from '$server/auth/jwt';
import { connectToDatabase } from '$server/mongo/db';
import type { Handle } from '@sveltejs/kit';
import { parse } from 'cookie';

export const handle: Handle = async ({ event, resolve }) => {
  // 1. Ensure DB is connected
  await connectToDatabase();

  // Only intercept routes under /cron/
  if (event.url.pathname.startsWith('/cron/')) {
    // Expect the secret in a header (e.g., X-Cron-Secret) or query param
    const providedSecret = event.request.headers.get('Authorization');
    const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

    if (!expectedSecret) {
      console.error('CRON_SECRET is not configured!');
      return new Response('Server misconfiguration', { status: 500 });
    }

    if (providedSecret !== expectedSecret) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  // 2. Parse cookies
  const cookieHeader = event.request.headers.get('cookie') ?? '';
  const cookies = parse(cookieHeader);
  const token = cookies.easyyield_jwt;

  // 3. Verify JWT and populate locals.address
  let address: string | null = null;
  if (token) {
    const payload = verifyJWT(token);
    if (payload) {
      address = payload.sub;
    }
  }

  // 4. Expose auth status to load functions and endpoints
  event.locals.address = address;

  // 4. If route starts with /v1/protected and user not logged in → 401
  if (event.url.pathname.startsWith('/v1/protected') && !event.locals.address) {
    return new Response('Unauthorized', { status: 401 });
  }

  // 5. Otherwise proceed as usual
  return resolve(event);
};
