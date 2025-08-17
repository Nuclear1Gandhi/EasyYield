import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '24h'; // Adjust as needed

export function generateJWT(walletAddress: string) {
  return jwt.sign(
    { sub: walletAddress },   // sub = subject = user id or wallet
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyJWT(token: string): { sub: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { sub: string };
  } catch (err) {
    return null;
  }
}