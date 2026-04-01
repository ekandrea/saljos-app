"use client";

import { useState } from 'react';
import { Lead, STATUS_LABELS, INDUSTRY_LABELS, TARGET_INDUSTRIES } from '@/lib/types';
import { scoreLead, bindLabel, bindColor } from '@/lib/scoring';
import { cn, fmtPhone } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Star } from 'lucide-react';

interface LeadsViewProps {
  leads: Lead[];
  seller: string;
  onOpenLead: (id: number) => void;
}

export function LeadsView({ leads, seller, onOpenLead }: LeadsViewProps) {
  const [search, setSearch] = useState('');
  const [sf, setSf] = useState('alla');

  const filtered = leads
    .filter(l => {
      if (l.status === 'blacklist' || l.status === 'prospekt') return false;
      if (sf !== 'alla' && l.status !== sf) return false;
      if (search) {
        const s = `${l.company} ${l.orgnr} ${l.phone} ${l.contact}`.toLowerCase();
        if (!s.includes(search.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => scoreLead(b, seller) - scoreLead(a, seller));

  const statusFilters = ['alla', 'ny', 'ring_senare', 'offert', 'order', 'avslutad', 'inte_intresserad', 'ej_svar'];

  const statusColor: Record<string, string> = {
    alla: '',
    ny: 'data-[active=true]:bg-blue-500 data-[active=true]:border-blue-500',
    ring_senare: 'data-[active=true]:bg-blue-600 data-[active=true]:border-blue-600',
    offert: 'data-[active=true]:bg-orange-500 data-[active=true]:border-orange-500',
    order: 'data-[active=true]:bg-green-500 data-[active=true]:border-green-500',
    avslutad: 'data-[active=true]:bg-slate-500 data-[active=true]:border-slate-500',
    inte_intresserad: 'data-[active=true]:bg-red-400 data-[active=true]:border-red-400',
    ej_svar: 'data-[active=true]:bg-slate-400 data-[active=true]:border-slate-400',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-blue-600 bg-clip-text text-transparent">
          Leads
        </h1>
        <span className="text-sm text-muted-foreground">{filtered.length} leads</span>
      </div>

      <div className="relative max-w-[300px] mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Sök bolagsnamn, org-nr, telefon..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="flex gap-1.5 flex-wrap mb-4">
        {statusFilters.map(s => (
          <Button
            key={s}
            variant={sf === s ? "default" : "outline"}
            size="sm"
            className={cn("text-xs h-7", sf === s && "text-white")}
            data-active={sf === s}
            onClick={() => setSf(s)}
          >
            {s === 'alla' ? `Alla (${filtered.length})` : STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-muted bg-muted/30">
                {['Bolagsnamn', 'Telefon', 'Operatör', 'Bindning', 'Status', 'Poäng'].map(h => (
                  <th key={h} className={cn("p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground", h === 'Poäng' ? 'text-right' : 'text-left')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map(l => {
                const score = scoreLead(l, seller);
                const isPrio = TARGET_INDUSTRIES.includes(l.industry);
                return (
                  <tr
                    key={l.id}
                    className={cn(
                      "border-b border-muted/50 cursor-pointer transition-colors",
                      isPrio ? "hover:bg-gradient-to-r hover:from-green-50 hover:to-transparent" : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent"
                    )}
                    onClick={() => onOpenLead(l.id)}
                  >
                    <td className="p-3">
                      <div className="font-semibold text-sm flex items-center gap-1.5">
                        {l.company}
                        {isPrio && <Star size={12} className="text-amber-400 fill-amber-400" />}
                      </div>
                      <div className="text-xs text-muted-foreground">{l.contact}</div>
                    </td>
                    <td className="p-3 text-sm font-mono text-muted-foreground">{fmtPhone(l.phone)}</td>
                    <td className="p-3"><Badge variant="outline" className="text-[10px]">{l.operator || 'Okänd'}</Badge></td>
                    <td className="p-3"><span className={cn("text-xs", bindColor(l.bindingDate))}>{bindLabel(l.bindingDate)}</span></td>
                    <td className="p-3"><Badge variant="secondary" className="text-[10px]">{STATUS_LABELS[l.status] || l.status}</Badge></td>
                    <td className="p-3 text-right">
                      {score > 0 ? (
                        <span className={cn(
                          "font-bold text-sm",
                          score >= 100 ? "text-green-600" : score >= 50 ? "text-blue-600" : "text-muted-foreground"
                        )}>
                          {score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
