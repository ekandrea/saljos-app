"use client";

import { useState } from 'react';
import { Lead, STATUS_LABELS } from '@/lib/types';
import { fmtPhone, fmtOrg } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface SearchViewProps {
  leads: Lead[];
  onOpenLead: (id: number) => void;
}

export function SearchView({ leads, onOpenLead }: SearchViewProps) {
  const [q, setQ] = useState('');
  const results = q.length >= 2
    ? leads.filter(l => `${l.company} ${l.orgnr} ${l.phone}`.toLowerCase().includes(q.toLowerCase()))
    : [];

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-[#5b5fc7] bg-clip-text text-transparent mb-4">
        Sök
      </h1>
      <Input
        placeholder="Sök bolagsnamn, org-nr eller telefon..."
        value={q}
        onChange={e => setQ(e.target.value)}
        className="text-base p-4 mb-4"
      />
      <div className="space-y-2">
        {results.map(l => (
          <Card key={l.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onOpenLead(l.id)}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <div className="font-bold text-sm">{l.company}</div>
                <div className="text-xs text-muted-foreground">{fmtOrg(l.orgnr)} &middot; {fmtPhone(l.phone)}</div>
              </div>
              <div className="flex gap-2">
                <Badge variant="outline">{l.operator}</Badge>
                <Badge variant="secondary">{STATUS_LABELS[l.status]}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
