import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/api-auth';
import { dbToLead, leadToDb } from '@/lib/lead-mapper';
import { Lead } from '@/lib/types';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Ej inloggad' }, { status: 401 });

  const { leads } = await request.json() as { leads: Lead[] };
  if (!leads?.length) return Response.json({ error: 'Inga leads' }, { status: 400 });

  // Map all leads to DB format, remove old IDs (DB auto-generates)
  const rows = leads.map(l => {
    const row = leadToDb(l);
    delete row.id;
    return row;
  });

  const { data, error } = await getSupabase()
    .from('leads_v2')
    .insert(rows)
    .select();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ leads: (data || []).map(dbToLead), count: data?.length || 0 });
}
