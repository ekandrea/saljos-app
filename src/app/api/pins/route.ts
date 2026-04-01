import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/api-auth';

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Ej inloggad' }, { status: 401 });

  const { data } = await getSupabase()
    .from('pinned_prospekts')
    .select('lead_id')
    .eq('seller_name', session.name);

  return Response.json({ pinnedIds: (data || []).map(r => r.lead_id) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Ej inloggad' }, { status: 401 });

  const { leadId } = await request.json();
  await getSupabase().from('pinned_prospekts').insert({ seller_name: session.name, lead_id: leadId });

  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Ej inloggad' }, { status: 401 });

  const { leadId } = await request.json();
  await getSupabase()
    .from('pinned_prospekts')
    .delete()
    .eq('seller_name', session.name)
    .eq('lead_id', leadId);

  return Response.json({ ok: true });
}
