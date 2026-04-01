import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/api-auth';
import { dbToLead, leadToDb } from '@/lib/lead-mapper';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Ej inloggad' }, { status: 401 });

  const { id } = await params;
  const updates = await request.json();
  const dbUpdates = leadToDb(updates);

  const { data, error } = await getSupabase()
    .from('leads_v2')
    .update(dbUpdates)
    .eq('id', parseInt(id))
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ lead: dbToLead(data) });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Ej inloggad' }, { status: 401 });

  const { id } = await params;
  const { error } = await getSupabase().from('leads_v2').delete().eq('id', parseInt(id));
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
