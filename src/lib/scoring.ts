import { Lead, TARGET_INDUSTRIES } from './types';

export function scoreLead(l: Lead, currentSeller: string): number {
  if (l.status === 'prospekt') return -1;
  if (!l.phone || l.phone.trim() === '') return -1;

  let s = 0;
  const today = new Date();

  if (l.bindingDate) {
    const d = Math.ceil((new Date(l.bindingDate).getTime() - today.getTime()) / 864e5);
    if (d < 0) s += 100;
    else if (d < 14) s += 80;
    else if (d < 30) s += 60;
    else if (d < 60) s += 40;
    else if (d < 90) s += 20;
  }

  if (TARGET_INDUSTRIES.includes(l.industry)) s += 50;

  if (l.nextCallDate && (today.getTime() - new Date(l.nextCallDate).getTime()) / 864e5 > 0) {
    s += Math.min(Math.ceil((today.getTime() - new Date(l.nextCallDate).getTime()) / 864e5) * 5, 30);
  }

  if (l.status === 'ny') s += 10;
  if (l.status === 'ej_svar') s += 5;
  if (l.status === 'ring_senare') s += 15;
  if (l.subs) s += l.subs.length * 2;

  if (l.lockedBy && l.lockedBy !== currentSeller) return -1000;
  if (l.lockedBy === currentSeller) s += 25;

  return s;
}

export function getAutopilotQueue(leads: Lead[], currentSeller: string) {
  const now = new Date();
  const callbacks = leads.filter(l =>
    l.nextCallDate && new Date(l.nextCallDate) <= now &&
    !['blacklist', 'order', 'prospekt', 'avslutad', 'inte_intresserad'].includes(l.status)
  );
  const offers = leads.filter(l =>
    ['offert', 'apg'].includes(l.status) && l.seller === currentSeller
  );
  const scored = leads
    .filter(l => !['blacklist', 'order', 'prospekt', 'avslutad', 'inte_intresserad'].includes(l.status))
    .map(l => ({ ...l, score: scoreLead(l, currentSeller) }))
    .filter(l => l.score > 0 && !callbacks.find(c => c.id === l.id) && !offers.find(o => o.id === l.id))
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return { callbacks, offers, scored, total: callbacks.length + offers.length + scored.length };
}

export function bindDays(d: string | null): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - new Date().getTime()) / 864e5);
}

export function bindLabel(d: string | null): string {
  const days = bindDays(d);
  if (days === null) return '—';
  if (days < 0) return `Utgången (${Math.abs(days)}d)`;
  return `${days} dagar`;
}

export function bindColor(d: string | null): string {
  const days = bindDays(d);
  if (days === null) return 'text-muted-foreground';
  if (days < 0) return 'text-red-500 font-bold';
  if (days < 30) return 'text-orange-500 font-bold';
  if (days < 90) return 'text-yellow-500 font-semibold';
  return 'text-muted-foreground';
}
