import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('saljos_token')?.value;
  if (!token) {
    return Response.json({ seller: null }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return Response.json({ seller: null }, { status: 401 });
  }

  return Response.json({
    seller: { name: payload.name, displayName: payload.displayName, isAdmin: payload.isAdmin },
  });
}
