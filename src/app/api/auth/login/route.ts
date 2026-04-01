import { getSupabase } from '@/lib/supabase';
import { signToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { name, password } = await request.json();
  if (!name || !password) {
    return Response.json({ error: 'Namn och lösenord krävs' }, { status: 400 });
  }

  const sellerName = name.toLowerCase().trim();
  const { data: seller } = await getSupabase()
    .from('sellers')
    .select('*')
    .eq('name', sellerName)
    .single();

  if (!seller) {
    return Response.json({ error: 'Fel användarnamn eller lösenord' }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, seller.password_hash);
  if (!valid) {
    return Response.json({ error: 'Fel användarnamn eller lösenord' }, { status: 401 });
  }

  const token = await signToken({
    name: seller.name,
    isAdmin: seller.is_admin,
    displayName: seller.display_name,
  });

  const response = Response.json({
    seller: { name: seller.name, displayName: seller.display_name, isAdmin: seller.is_admin },
  });

  // Set httpOnly cookie
  return new Response(response.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `saljos_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 3600}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`,
    },
  });
}
