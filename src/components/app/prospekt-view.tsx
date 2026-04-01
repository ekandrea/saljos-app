"use client";

import { useState } from 'react';
import { Lead, INDUSTRY_LABELS } from '@/lib/types';
import { cn, fmtPhone, fmtOrg } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Bookmark, Building2, ArrowRight } from 'lucide-react';

interface ProspektViewProps {
  leads: Lead[];
  pinnedIds: number[];
  onTogglePin: (id: number) => void;
  onOpenProspekt: (id: number) => void;
  onConvertToLead: (id: number) => void;
}

function ProspektCard({ lead, isPinned, onTogglePin, onOpen, onConvert }: {
  lead: Lead;
  isPinned: boolean;
  onTogglePin: () => void;
  onOpen: () => void;
  onConvert: () => void;
}) {
  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all hover:shadow-md relative",
        isPinned ? "border-amber-300 bg-amber-50/30 hover:border-amber-400" : "hover:border-blue-200"
      )}
      onClick={onOpen}
    >
      <CardContent className="p-4">
        {/* Pin button */}
        <button
          onClick={e => { e.stopPropagation(); onTogglePin(); }}
          className={cn(
            "absolute top-3 right-3 p-1 rounded-md transition-all",
            isPinned
              ? "text-amber-500 hover:text-amber-600"
              : "text-transparent group-hover:text-muted-foreground/40 hover:!text-amber-400"
          )}
        >
          <Bookmark size={16} className={isPinned ? "fill-amber-400" : ""} />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
            <Building2 size={16} className="text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{lead.company}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {fmtOrg(lead.orgnr)} · {fmtPhone(lead.phone)}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-[10px]">
                {INDUSTRY_LABELS[lead.industry] || lead.industry}
              </Badge>
              {lead.operator && (
                <Badge variant="outline" className="text-[10px]">{lead.operator}</Badge>
              )}
              {lead.subs && lead.subs.length > 0 && (
                <span className="text-[10px] text-muted-foreground">{lead.subs.length} abb</span>
              )}
            </div>
          </div>
        </div>

        {/* Convert button - visible on hover */}
        <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            className="flex-1 h-7 text-xs bg-green-500 hover:bg-green-600 text-white"
            onClick={e => { e.stopPropagation(); onConvert(); }}
          >
            Gör till lead <ArrowRight size={11} className="ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProspektView({ leads, pinnedIds, onTogglePin, onOpenProspekt, onConvertToLead }: ProspektViewProps) {
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('alla');

  const prospekts = leads.filter(l => l.status === 'prospekt');

  const filtered = prospekts
    .filter(l => {
      if (industryFilter !== 'alla' && l.industry !== industryFilter) return false;
      if (search) {
        const s = `${l.company} ${l.orgnr} ${l.phone} ${l.contact}`.toLowerCase();
        if (!s.includes(search.toLowerCase())) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Pinned first
      const aPinned = pinnedIds.includes(a.id) ? 1 : 0;
      const bPinned = pinnedIds.includes(b.id) ? 1 : 0;
      if (bPinned !== aPinned) return bPinned - aPinned;
      return a.company.localeCompare(b.company, 'sv');
    });

  const pinned = filtered.filter(l => pinnedIds.includes(l.id));
  const unpinned = filtered.filter(l => !pinnedIds.includes(l.id));

  // Get unique industries from prospekts
  const industries = [...new Set(prospekts.map(l => l.industry))].sort();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-slate-500 bg-clip-text text-transparent">
            Prospekt
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bolagsverket-data · Pinna intressanta · Gör till lead när du vill ringa
          </p>
        </div>
        <span className="text-sm text-muted-foreground">{prospekts.length} prospekt</span>
      </div>

      {/* Search + filters */}
      <div className="flex gap-3 items-center mb-3">
        <div className="relative max-w-[300px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Sök bolagsnamn, org-nr, telefon..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {pinnedIds.length > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            <Bookmark size={12} className="text-amber-500 fill-amber-400" />
            <span className="text-xs font-medium text-amber-700">{pinnedIds.length} pinnade</span>
          </div>
        )}
      </div>

      {/* Industry filter */}
      <div className="flex gap-1.5 flex-wrap mb-5">
        <Button
          variant={industryFilter === 'alla' ? "default" : "outline"}
          size="sm"
          className="text-xs h-7"
          onClick={() => setIndustryFilter('alla')}
        >
          Alla ({prospekts.length})
        </Button>
        {industries.map(ind => (
          <Button
            key={ind}
            variant={industryFilter === ind ? "default" : "outline"}
            size="sm"
            className="text-xs h-7"
            onClick={() => setIndustryFilter(ind)}
          >
            {INDUSTRY_LABELS[ind] || ind} ({prospekts.filter(l => l.industry === ind).length})
          </Button>
        ))}
      </div>

      {/* Pinned section */}
      {pinned.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Bookmark size={14} className="text-amber-500 fill-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600">Dina pinnade</h3>
            <Badge className="bg-amber-100 text-amber-700 text-[10px] border-amber-200">{pinned.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinned.map(l => (
              <ProspektCard
                key={l.id}
                lead={l}
                isPinned={true}
                onTogglePin={() => onTogglePin(l.id)}
                onOpen={() => onOpenProspekt(l.id)}
                onConvert={() => onConvertToLead(l.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* All prospekts */}
      <div>
        {pinned.length > 0 && unpinned.length > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded bg-slate-300" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Övriga prospekt</h3>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {unpinned.slice(0, 60).map(l => (
            <ProspektCard
              key={l.id}
              lead={l}
              isPinned={false}
              onTogglePin={() => onTogglePin(l.id)}
              onOpen={() => onOpenProspekt(l.id)}
              onConvert={() => onConvertToLead(l.id)}
            />
          ))}
        </div>
        {unpinned.length > 60 && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Visar 60 av {unpinned.length} · Sök för att hitta fler
          </p>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Building2 size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {search ? 'Inga prospekt matchar sökningen' : 'Inga prospekt ännu'}
          </p>
        </div>
      )}
    </div>
  );
}
