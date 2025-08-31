import { describe, it, expect } from 'vitest';
import { POST as loginHandler } from '../src/routes/api/auth/+server';
import { GET as protectedHandler } from '../src/routes/api/v1/protected/+server';
import { serialize, parse } from 'cookie';
import { JWT_KEY } from '$lib/constants';
import { generateJWT } from '$server/auth/jwt';

function makeRequest(jsonBody?: any, cookieHeader?: string) {
  const request = new Request('http://test/api', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { cookie: cookieHeader } : {})
    },
    body: jsonBody ? JSON.stringify(jsonBody) : undefined
  });

  // basic mock of cookies API
  const cookies = {
    get(name: string) {
      if (!cookieHeader) return undefined;
      const parsed = parse(cookieHeader);
      return parsed[name];
    }
  } as any;

  return { request, cookies };
}

describe('POST /api/auth/login', () => {
  it('returns 400 for missing address', async () => {
    const { request } = makeRequest({});
    const response = await loginHandler({ request } as any);
    expect(response.status).toBe(400);
  });

  it('sets HttpOnly cookie on valid address', async () => {
    const { request } = makeRequest({ address: 'rdx1qtestaddress' });
    const response = await loginHandler({ request } as any);

    expect(response.status).toBe(200);

    const setCookie = response.headers.get('Set-Cookie')!;
    expect(setCookie).toContain(`${JWT_KEY}=`);
    expect(setCookie).toContain('HttpOnly');
  });
});

describe('GET /api/protected', () => {
  it('rejects without JWT cookie', async () => {
    const { request, cookies } = makeRequest(undefined, '');
    const response = await protectedHandler({ cookies } as any);
    expect(response.status).toBe(401);
  });

  it('accepts with valid JWT cookie', async () => {
    const token = generateJWT('rdx1qtestaddress');
    const cookieHeader = serialize(`${JWT_KEY}`, token, { path: '/' });

    const { request, cookies } = makeRequest(undefined, cookieHeader);
    const response = await protectedHandler({ cookies } as any);

    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toBe('Secret data');
  });

  it('rejects with invalid JWT cookie', async () => {
    const cookieHeader = serialize(`${JWT_KEY}`, 'invalid.token', { path: '/' });
    const { cookies } = makeRequest(undefined, cookieHeader);
    const response = await protectedHandler({ cookies } as any);

    expect(response.status).toBe(401);
  });
});
