import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/api-auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getSession();
  if (!session?.isAdmin) return Response.json({ error: 'Ej admin' }, { status: 403 });

  const { data } = await getSupabase()
    .from('sellers')
    .select('id, name, display_name, is_admin, created_at')
    .order('created_at');

  return Response.json({ sellers: data || [] });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.isAdmin) return Response.json({ error: 'Ej admin' }, { status: 403 });

  const { name, displayName, password, isAdmin } = await request.json();
  if (!name || !password) {
    return Response.json({ error: 'Namn och lösenord krävs' }, { status: 400 });
  }

  const sellerName = name.toLowerCase().trim();
  const hash = await bcrypt.hash(password, 10);

  const { data, error } = await getSupabase()
    .from('sellers')
    .insert({
      name: sellerName,
      display_name: displayName || name,
      password_hash: hash,
      is_admin: isAdmin || false,
    })
    .select('id, name, display_name, is_admin, created_at')
    .single();

  if (error) {
    if (error.code === '23505') return Response.json({ error: 'Användaren finns redan' }, { status: 409 });
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ seller: data });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session?.isAdmin) return Response.json({ error: 'Ej admin' }, { status: 403 });

  const { id } = await request.json();
  if (!id) return Response.json({ error: 'ID krävs' }, { status: 400 });

  const { error } = await getSupabase().from('sellers').delete().eq('id', id);
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
