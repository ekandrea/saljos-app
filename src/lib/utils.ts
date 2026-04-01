import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normPhone(p: string): string {
  return p ? String(p).replace(/[\s\-\(\)\.]/g, '') : '';
}

export function fmtPhone(p: string): string {
  let n = normPhone(p);
  if (n.startsWith('+46')) n = '0' + n.slice(3);
  if (n.startsWith('46') && n.length > 8) n = '0' + n.slice(2);
  if (n.length === 10) return `${n.slice(0, 3)}-${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8)}`;
  return p || '—';
}

export function normOrg(o: string): string {
  return (o || '').replace(/[\s\-]/g, '');
}

export function fmtOrg(o: string): string {
  const n = normOrg(o);
  if (n.length === 10) return `${n.slice(0, 6)}-${n.slice(6)}`;
  return o || '';
}

export function toTel(p: string): string {
  let n = normPhone(p).replace(/^\+/, '');
  if (n.startsWith('0')) n = '46' + n.slice(1);
  if (!n.startsWith('46')) n = '46' + n;
  return `tel:+${n}`;
}

export function detectIndustry(name: string): string {
  if (!name) return 'annat';
  const x = name.toLowerCase();
  if (x.match(/åkeri|transport|frakt|lastbil|budtjänst/)) return 'åkeri';
  if (x.match(/måleri|målare|färg|puts/)) return 'måleri';
  if (x.match(/bygg|byggn|snickare|betong|schakt|mark/)) return 'bygg';
  if (x.match(/logistik|lager|distribution|spedition/)) return 'logistik';
  if (x.match(/cykel|bike|moped/)) return 'cykel';
  if (x.match(/vvs|rör|plåt|kyl|värme/)) return 'vvs';
  if (x.match(/el |elektriker|elinstallation/)) return 'el';
  return 'annat';
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 10) return 'God morgon';
  if (h < 17) return 'Hej';
  return 'God kväll';
}

export function fmtDate(d: string): string {
  if (!d) return '';
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
  } catch {
    return d;
  }
}
