"use client";

import { Lead, INDUSTRY_LABELS } from '@/lib/types';
import { bindLabel, bindColor } from '@/lib/scoring';
import { cn, fmtPhone, fmtOrg, normOrg, toTel } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bookmark, Phone, ExternalLink, ArrowRight, Building2 } from 'lucide-react';

interface ProspektDetailProps {
  lead: Lead;
  isPinned: boolean;
  onTogglePin: () => void;
  onBack: () => void;
  onConvertToLead: () => void;
}

export function ProspektDetail({ lead, isPinned, onTogglePin, onBack, onConvertToLead }: ProspektDetailProps) {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight">{lead.company}</h2>
              <button
                onClick={onTogglePin}
                className={cn(
                  "p-1 rounded-md transition-all",
                  isPinned ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground/30 hover:text-amber-400"
                )}
              >
                <Bookmark size={18} className={isPinned ? "fill-amber-400" : ""} />
              </button>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{INDUSTRY_LABELS[lead.industry] || lead.industry}</Badge>
              {lead.operator && <Badge variant="outline">{lead.operator}</Badge>}
              <span className="text-xs text-muted-foreground">{fmtOrg(lead.orgnr)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {['Allabolag', 'Merinfo', 'Google'].map(name => (
            <Button
              key={name}
              variant="ghost"
              size="sm"
              className="text-xs h-7 px-2 text-muted-foreground hover:text-blue-600"
              onClick={() => {
                const urls: Record<string, string> = {
                  Allabolag: `https://www.allabolag.se/${normOrg(lead.orgnr)}`,
                  Merinfo: `https://www.merinfo.se/search?q=${encodeURIComponent(fmtOrg(lead.orgnr))}`,
                  Google: `https://www.google.com/search?q=${encodeURIComponent(lead.company)}`,
                };
                window.open(urls[name], '_blank');
              }}
            >
              <ExternalLink size={10} className="mr-1" />{name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_300px] gap-4">
        {/* Main info */}
        <div className="space-y-4">
          {/* Company overview */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Företagsinfo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Kontakt</label>
                  <span className="text-sm font-medium">{lead.contact || '—'}</span>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Telefon</label>
                  {lead.phone ? (
                    <a href={toTel(lead.phone)} className="text-sm font-medium text-blue-600 hover:underline">
                      {fmtPhone(lead.phone)}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">E-post</label>
                  <span className="text-sm">{lead.email || '—'}</span>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Webbsida</label>
                  {lead.website ? (
                    <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                      {lead.website}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Operatör</label>
                  <span className="text-sm font-medium">{lead.operator || 'Okänd'}</span>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-medium block mb-0.5">Bindning</label>
                  <span className={cn("text-sm font-medium", bindColor(lead.bindingDate))}>
                    {bindLabel(lead.bindingDate)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscriptions */}
          {lead.subs && lead.subs.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Abonnemang</h3>
                  <Badge variant="secondary" className="text-[10px]">{lead.subs.length} st</Badge>
                </div>
                <div className="space-y-1.5">
                  {lead.subs.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                        <div>
                          <span className="font-medium text-sm">{s.user || 'Okänd'}</span>
                          <span className="ml-2 text-sm text-muted-foreground font-mono">{fmtPhone(s.phone)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {s.plan && <span className="text-xs text-muted-foreground">{s.plan}</span>}
                        <span className={cn("text-xs font-semibold", bindColor(s.end))}>{bindLabel(s.end)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar actions */}
        <div className="space-y-4">
          {/* Convert CTA */}
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-green-700 mb-2">Intressant?</h3>
              <p className="text-xs text-green-600 mb-4">
                Gör till lead för att börja ringa och jobba med detta företag.
              </p>
              <Button
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-10"
                onClick={onConvertToLead}
              >
                Gör till lead <ArrowRight size={14} className="ml-2" />
              </Button>
            </CardContent>
          </Card>

          {/* Pin card */}
          <Card className={cn(isPinned ? "border-amber-200 bg-amber-50/30" : "")}>
            <CardContent className="p-5">
              <Button
                variant={isPinned ? "default" : "outline"}
                className={cn(
                  "w-full h-10",
                  isPinned ? "bg-amber-500 hover:bg-amber-600 text-white" : ""
                )}
                onClick={onTogglePin}
              >
                <Bookmark size={14} className={cn("mr-2", isPinned ? "fill-white" : "")} />
                {isPinned ? 'Pinnad' : 'Pinna prospekt'}
              </Button>
              <p className="text-[10px] text-muted-foreground mt-2 text-center">
                {isPinned ? 'Visas överst i listan' : 'Pinnade prospekt visas överst'}
              </p>
            </CardContent>
          </Card>

          {/* Quick call */}
          {lead.phone && (
            <Card>
              <CardContent className="p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Snabbring</h3>
                <Button
                  variant="outline"
                  className="w-full h-10 text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => window.open(toTel(lead.phone), '_self')}
                >
                  <Phone size={14} className="mr-2" />
                  {fmtPhone(lead.phone)}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
