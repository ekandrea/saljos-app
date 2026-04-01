import { SignJWT, jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'saljos-dev-secret-change-me');

export async function signToken(payload: { name: string; isAdmin: boolean; displayName: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { name: string; isAdmin: boolean; displayName: string };
  } catch {
    return null;
  }
}
