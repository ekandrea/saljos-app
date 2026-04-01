export interface Sub {
  phone: string;
  user: string;
  portDate: string;
  end: string;
  plan: string;
}

export interface HistoryEntry {
  date: string;
  outcome: string;
  note: string;
  seller: string;
}

export interface Lead {
  id: number;
  company: string;
  contact: string;
  phone: string;
  orgnr: string;
  operator: string;
  email: string;
  plan: string;
  priceOrig: string;
  priceDiscount: string;
  priceFinal: string;
  bindingDate: string | null;
  industry: string;
  portingDate: string | null;
  nextCallDate: string | null;
  status: string;
  note: string;
  vdName: string;
  vdPhone: string;
  vdEmail: string;
  website: string;
  offerSent: boolean;
  offerOpened: boolean;
  history: HistoryEntry[];
  lockedBy: string | null;
  lockedAt: string | null;
  seller: string | null;
  subs: Sub[];
  tb_amount: number;
  nyteck_count: number;
  forlang_count: number;
  deal_type: string | null;
  score?: number;
}

export type ViewName = 'dialer' | 'pipeline' | 'leads' | 'dash' | 'sok' | 'settings';

export const STATUS_LABELS: Record<string, string> = {
  ny: 'Ny',
  prospekt: 'Prospekt',
  ring_senare: 'Ring senare',
  offert: 'Offert skickad',
  order: 'Order',
  inte_intresserad: 'Inte intresserad',
  avslutad: 'Avslutad',
  ej_svar: 'Ej svar',
  blacklist: 'Spärrad',
  apg: 'APG',
};

export const TARGET_INDUSTRIES = ['åkeri', 'måleri', 'bygg', 'logistik', 'cykel'];

export const INDUSTRY_LABELS: Record<string, string> = {
  åkeri: '🚛 Åkeri',
  måleri: '🎨 Måleri',
  bygg: '🏗️ Bygg',
  logistik: '📦 Logistik',
  cykel: '🚲 Cykel',
  vvs: '🔧 VVS',
  el: '⚡ El',
  annat: '🏢 Övrigt',
};
