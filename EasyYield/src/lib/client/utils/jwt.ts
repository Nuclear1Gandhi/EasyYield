export function getExistingJwt(cookieName = 'jwt'): string | null {
  if (typeof document === 'undefined') return null; // SSR guard

  const name = cookieName + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return null;
}

export function decodeJwt(token: string): { sub: string; exp?: number } | null {
  try {
    const base64Payload = token.split('.')[1];
    const payload = atob(base64Payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

// Optional: Check if JWT is expired
export function isJwtExpired(decoded: { exp?: number }): boolean {
  if (!decoded.exp) return false;
  return Date.now() >= decoded.exp * 1000;
}
