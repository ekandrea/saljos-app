import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/api-auth';
import { dbToLead, leadToDb } from '@/lib/lead-mapper';

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Ej inloggad' }, { status: 401 });

  const { data, error } = await getSupabase()
    .from('leads_v2')
    .select('*')
    .order('id');

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ leads: (data || []).map(dbToLead) });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Ej inloggad' }, { status: 401 });

  const lead = await request.json();
  const dbRow = leadToDb(lead);

  const { data, error } = await getSupabase()
    .from('leads_v2')
    .insert(dbRow)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ lead: dbToLead(data) });
}
