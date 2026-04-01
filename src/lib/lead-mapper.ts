import { Lead } from './types';

// Map DB row (snake_case) to frontend Lead (camelCase)
export function dbToLead(row: Record<string, unknown>): Lead {
  return {
    id: row.id as number,
    company: (row.company as string) || '',
    contact: (row.contact as string) || '',
    phone: (row.phone as string) || '',
    orgnr: (row.orgnr as string) || '',
    operator: (row.operator as string) || '',
    email: (row.email as string) || '',
    plan: (row.plan as string) || '',
    priceOrig: (row.price_orig as string) || '',
    priceDiscount: (row.price_discount as string) || '',
    priceFinal: (row.price_final as string) || '',
    bindingDate: (row.binding_date as string) || null,
    industry: (row.industry as string) || '',
    portingDate: (row.porting_date as string) || null,
    nextCallDate: (row.next_call_date as string) || null,
    status: (row.status as string) || 'ny',
    note: (row.note as string) || '',
    vdName: (row.vd_name as string) || '',
    vdPhone: (row.vd_phone as string) || '',
    vdEmail: (row.vd_email as string) || '',
    website: (row.website as string) || '',
    offerSent: (row.offer_sent as boolean) || false,
    offerOpened: (row.offer_opened as boolean) || false,
    history: (row.history as Lead['history']) || [],
    lockedBy: (row.locked_by as string) || null,
    lockedAt: (row.locked_at as string) || null,
    seller: (row.seller as string) || null,
    subs: (row.subs as Lead['subs']) || [],
    tb_amount: (row.tb_amount as number) || 0,
    nyteck_count: (row.nyteck_count as number) || 0,
    forlang_count: (row.forlang_count as number) || 0,
    deal_type: (row.deal_type as string) || null,
  };
}

// Map frontend Lead (camelCase) to DB row (snake_case)
export function leadToDb(lead: Partial<Lead>): Record<string, unknown> {
  const map: Record<string, unknown> = {};
  if (lead.company !== undefined) map.company = lead.company;
  if (lead.contact !== undefined) map.contact = lead.contact;
  if (lead.phone !== undefined) map.phone = lead.phone;
  if (lead.orgnr !== undefined) map.orgnr = lead.orgnr;
  if (lead.operator !== undefined) map.operator = lead.operator;
  if (lead.email !== undefined) map.email = lead.email;
  if (lead.plan !== undefined) map.plan = lead.plan;
  if (lead.priceOrig !== undefined) map.price_orig = lead.priceOrig;
  if (lead.priceDiscount !== undefined) map.price_discount = lead.priceDiscount;
  if (lead.priceFinal !== undefined) map.price_final = lead.priceFinal;
  if (lead.bindingDate !== undefined) map.binding_date = lead.bindingDate;
  if (lead.industry !== undefined) map.industry = lead.industry;
  if (lead.portingDate !== undefined) map.porting_date = lead.portingDate;
  if (lead.nextCallDate !== undefined) map.next_call_date = lead.nextCallDate;
  if (lead.status !== undefined) map.status = lead.status;
  if (lead.note !== undefined) map.note = lead.note;
  if (lead.vdName !== undefined) map.vd_name = lead.vdName;
  if (lead.vdPhone !== undefined) map.vd_phone = lead.vdPhone;
  if (lead.vdEmail !== undefined) map.vd_email = lead.vdEmail;
  if (lead.website !== undefined) map.website = lead.website;
  if (lead.offerSent !== undefined) map.offer_sent = lead.offerSent;
  if (lead.offerOpened !== undefined) map.offer_opened = lead.offerOpened;
  if (lead.history !== undefined) map.history = lead.history;
  if (lead.lockedBy !== undefined) map.locked_by = lead.lockedBy;
  if (lead.lockedAt !== undefined) map.locked_at = lead.lockedAt;
  if (lead.seller !== undefined) map.seller = lead.seller;
  if (lead.subs !== undefined) map.subs = lead.subs;
  if (lead.tb_amount !== undefined) map.tb_amount = lead.tb_amount;
  if (lead.nyteck_count !== undefined) map.nyteck_count = lead.nyteck_count;
  if (lead.forlang_count !== undefined) map.forlang_count = lead.forlang_count;
  if (lead.deal_type !== undefined) map.deal_type = lead.deal_type;
  return map;
}
