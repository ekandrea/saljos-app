"use client";

import { Lead, STATUS_LABELS, INDUSTRY_LABELS } from '@/lib/types';
import { cn, fmtPhone, fmtDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarClock, Unlock, ArrowRight } from 'lucide-react';

interface PipelineViewProps {
  leads: Lead[];
  seller: string;
  onOpenLead: (id: number) => void;
  onUnlock: (id: number) => void;
}

function PipelineCard({ l, onOpenLead, onUnlock, accent }: { l: Lead; onOpenLead: (id: number) => void; onUnlock: (id: number) => void; accent: string }) {
  return (
    <Card
      className={cn("hover:shadow-md transition-all cursor-pointer group", `hover:border-${accent}-300`)}
      onClick={() => onOpenLead(l.id)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-bold text-sm">{l.company}</div>
            <div className="flex gap-2 items-center mt-1">
              <Badge variant="secondary" className="text-[10px]">{INDUSTRY_LABELS[l.industry] || l.industry}</Badge>
              <span className="text-xs text-muted-foreground">{fmtPhone(l.phone)}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px]">{STATUS_LABELS[l.status]}</Badge>
        </div>
        {l.nextCallDate && (
          <div className="text-xs text-orange-500 font-semibold mb-2">
            <CalendarClock size={12} className="inline mr-1" />{fmtDate(l.nextCallDate)}
          </div>
        )}
        <div className="flex gap-2">
          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={e => { e.stopPropagation(); onOpenLead(l.id); }}>
            Öppna <ArrowRight size={12} className="ml-1" />
          </Button>
          <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); onUnlock(l.id); }}>
            <Unlock size={13} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function PipelineView({ leads, seller, onOpenLead, onUnlock }: PipelineViewProps) {
  const callbacks = leads.filter(l => l.nextCallDate && new Date(l.nextCallDate) <= new Date() && !['blacklist', 'order', 'prospekt'].includes(l.status) && l.seller === seller);
  const offers = leads.filter(l => ['offert', 'apg'].includes(l.status) && l.seller === seller);
  const active = leads.filter(l => l.lockedBy === seller && !['blacklist', 'order', 'prospekt'].includes(l.status));

  const sections = [
    { t: 'Återkomster', items: callbacks, c: 'bg-orange-500', accent: 'orange', desc: 'Dessa väntar på dig — ring nu!' },
    { t: 'Offerter ute', items: offers, c: 'bg-amber-500', accent: 'amber', desc: 'Följ upp = stäng affär' },
    { t: 'Aktiva leads', items: active, c: 'bg-blue-500', accent: 'blue', desc: 'Du jobbar med dessa' },
  ];

  const totalValue = offers.reduce((s, l) => s + (l.tb_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-blue-600 bg-clip-text text-transparent">
          Pipeline
        </h1>
        {totalValue > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <span className="text-xs text-green-600 font-medium">Potentiellt TB i pipeline: </span>
            <span className="text-sm font-bold text-green-700">{totalValue.toLocaleString('sv-SE')} kr</span>
          </div>
        )}
      </div>

      {sections.map(s => (
        <div key={s.t}>
          <div className="flex items-center gap-2 mb-1">
            <div className={cn("w-1.5 h-5 rounded", s.c)} />
            <h3 className="text-sm font-bold text-foreground">{s.t}</h3>
            <Badge variant="secondary" className="text-[10px]">{s.items.length}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-3 ml-3.5">{s.desc}</p>
          {s.items.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {s.items.map(l => <PipelineCard key={l.id} l={l} onOpenLead={onOpenLead} onUnlock={onUnlock} accent={s.accent} />)}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pl-3.5 italic">Tomt — bra jobbat! &#128170;</p>
          )}
        </div>
      ))}
    </div>
  );
}
