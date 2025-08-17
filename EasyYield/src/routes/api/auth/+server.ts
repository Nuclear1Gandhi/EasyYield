import { JWT_KEY } from '$lib/constants';
import { generateJWT } from '$server/auth/jwt';
import type { RequestHandler } from '@sveltejs/kit';
import { serialize } from 'cookie';

export const POST: RequestHandler = async ({ request }) => {
  const { address } = await request.json();
  // (Optional:) Validate the address format
  if (!address || typeof address !== 'string' || !address.startsWith('rdx1')) {
    return new Response('Invalid address', { status: 400 });
  }

  // Issue the JWT for this address
  const token = generateJWT(address);

  // Set JWT in a secure, HTTP-only cookie
  const cookie = serialize(JWT_KEY, token, {
    path: '/',
    httpOnly: true,      // Prevent JS/XSS access
    secure: true,        // Only send over HTTPS
    sameSite: 'strict',  // Strictest CSRF policy; adjust if needed
    maxAge: 60 * 60      // 1 hour expiration; tweak as needed
  });

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Set-Cookie': cookie,
      'Content-Type': 'application/json'
    }
  });
};
