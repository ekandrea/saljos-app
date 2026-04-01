import { getSupabase } from '@/lib/supabase';
import { getSession } from '@/lib/api-auth';
import { leadToDb } from '@/lib/lead-mapper';

export async function POST() {
  const session = await getSession();
  if (!session?.isAdmin) return Response.json({ error: 'Ej admin' }, { status: 403 });

  const db = getSupabase();

  // 1. Read all rows from old 'leads' table
  const { data: oldRows, error: readErr } = await db
    .from('leads')
    .select('seller, data');

  if (readErr) return Response.json({ error: 'Kunde inte läsa gamla tabellen: ' + readErr.message }, { status: 500 });
  if (!oldRows?.length) return Response.json({ error: 'Inga gamla leads hittade' }, { status: 404 });

  let totalMigrated = 0;

  for (const row of oldRows) {
    const sellerData = row.data;
    if (!sellerData?.leads?.length) continue;

    // Map each lead to DB format
    const dbRows = sellerData.leads.map((lead: Record<string, unknown>) => {
      const mapped = leadToDb(lead as never);
      delete mapped.id; // Let DB auto-generate
      if (!mapped.seller) mapped.seller = row.seller;
      return mapped;
    });

    // Insert in batches of 100
    for (let i = 0; i < dbRows.length; i += 100) {
      const batch = dbRows.slice(i, i + 100);
      const { error: insertErr } = await db.from('leads_v2').insert(batch);
      if (insertErr) {
        return Response.json({
          error: `Fel vid insert (batch ${i}): ${insertErr.message}`,
          migrated: totalMigrated,
        }, { status: 500 });
      }
      totalMigrated += batch.length;
    }
  }

  return Response.json({ ok: true, migrated: totalMigrated });
}
