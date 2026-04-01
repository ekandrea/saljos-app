import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { getSupabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get('saljos_token')?.value;
  if (!token) return Response.json({ error: 'Ej inloggad' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return Response.json({ error: 'Ej inloggad' }, { status: 401 });

  const { oldPassword, newPassword } = await request.json();
  if (!oldPassword || !newPassword) {
    return Response.json({ error: 'Båda lösenord krävs' }, { status: 400 });
  }
  if (newPassword.length < 4) {
    return Response.json({ error: 'Lösenord måste vara minst 4 tecken' }, { status: 400 });
  }

  const { data: seller } = await getSupabase()
    .from('sellers')
    .select('password_hash')
    .eq('name', payload.name)
    .single();

  if (!seller) return Response.json({ error: 'Användare hittades inte' }, { status: 404 });

  const valid = await bcrypt.compare(oldPassword, seller.password_hash);
  if (!valid) return Response.json({ error: 'Fel nuvarande lösenord' }, { status: 401 });

  const hash = await bcrypt.hash(newPassword, 10);
  await getSupabase().from('sellers').update({ password_hash: hash }).eq('name', payload.name);

  return Response.json({ ok: true });
}
