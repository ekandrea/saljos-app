"use client";

import { useState, useEffect, useCallback } from 'react';
import { Lead, INDUSTRY_LABELS } from '@/lib/types';
import { bindLabel, bindColor } from '@/lib/scoring';
import { cn, fmtPhone, fmtOrg, normOrg, toTel } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Phone, PhoneMissed, CalendarClock, FileText, Trophy, SkipForward, ArrowLeft, ExternalLink, Copy, Check, Globe, Building, Search as SearchIcon, Keyboard } from 'lucide-react';

interface CustomerCardProps {
  lead: Lead;
  leads: Lead[];
  seller: string;
  onUpdate: (leads: Lead[]) => void;
  onStop: () => void;
  onNext: (outcome: string, extra?: { date?: string; tb?: number }) => void;
}

const QUICK_NOTES = [
  'Var i möte',
  'Ring efter lunch',
  'Vill ha offert',
  'Inte intresserad just nu',
  'Prata med beslutsfattare',
  'Skicka info via mail',
  'Byta operatör vid utgång',
];

export function CustomerCard({ lead, leads, seller, onUpdate, onStop, onNext }: CustomerCardProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [callbackDate, setCallbackDate] = useState('');
  const [showTbInput, setShowTbInput] = useState(false);
  const [tbAmount, setTbAmount] = useState('');

  const updateField = (field: keyof Lead, value: string) => {
    onUpdate(leads.map(l => l.id === lead.id ? { ...l, [field]: value } : l));
  };
  const lastNote = lead.history?.length ? lead.history[lead.history.length - 1] : null;
  const callCount = lead.history?.filter(h => h.seller === seller).length || 0;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleOutcome = useCallback((type: string) => {
    if (type === 'ringsenare') {
      setShowDatePicker(true);
      return;
    }
    if (type === 'order') {
      setShowTbInput(true);
      return;
    }
    onNext(type);
  }, [onNext]);

  const confirmCallback = () => {
    if (!callbackDate) return;
    onNext('ringsenare', { date: callbackDate });
    setShowDatePicker(false);
    setCallbackDate('');
  };

  const confirmOrder = () => {
    onNext('order', { tb: parseInt(tbAmount) || 0 });
    setShowTbInput(false);
    setTbAmount('');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger if typing in input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (showDatePicker || showTbInput) return;

      switch (e.key.toLowerCase()) {
        case 'n': handleOutcome('nosvar'); break;
        case 'r': handleOutcome('ringsenare'); break;
        case 'o': handleOutcome('offert'); break;
        case 'a': handleOutcome('order'); break;
        case 's': handleOutcome('skip'); break;
        case 'escape': onStop(); break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleOutcome, onStop, showDatePicker, showTbInput]);

  const CopyBtn = ({ text, label }: { text: string; label: string }) => (
    <button
      onClick={e => { e.stopPropagation(); copyToClipboard(text, label); }}
      className="inline-flex items-center gap-1 text-muted-foreground hover:text-blue-600 transition-colors"
      title={`Kopiera ${label}`}
    >
      {copied === label ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );

  return (
    <div className="pb-16 max-w-5xl mx-auto">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onStop} className="mr-1">
            <ArrowLeft size={16} />
          </Button>
          <h2 className="text-xl font-extrabold tracking-tight">{lead.company}</h2>
          <Badge variant="secondary">{INDUSTRY_LABELS[lead.industry] || lead.industry}</Badge>
          <Badge variant="outline" className="font-mono">{lead.operator || 'Okänd'}</Badge>
          <span className={cn("text-sm font-bold px-2 py-0.5 rounded", bindColor(lead.bindingDate))}>
            {bindLabel(lead.bindingDate)}
          </span>
          {callCount > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {callCount} tidigare samtal
            </span>
          )}
        </div>
      </div>

      {/* External links bar */}
      <div className="flex gap-2 mb-4">
        {[
          { name: 'Allabolag', icon: <Building size={13} />, url: `https://www.allabolag.se/${normOrg(lead.orgnr)}` },
          { name: 'Merinfo', icon: <SearchIcon size={13} />, url: `https://www.merinfo.se/search?q=${encodeURIComponent(fmtOrg(lead.orgnr))}` },
          { name: 'Google', icon: <Globe size={13} />, url: `https://www.google.com/search?q=${encodeURIComponent(lead.company)}` },
          { name: lead.website || 'Webbsida', icon: <ExternalLink size={13} />, url: lead.website ? (lead.website.startsWith('http') ? lead.website : `https://${lead.website}`) : '' },
        ].filter(l => l.url).map(link => (
          <Button
            key={link.name}
            variant="outline"
            size="sm"
            className="text-xs h-8 px-3 gap-1.5 text-muted-foreground hover:text-blue-600 hover:border-blue-300"
            onClick={() => window.open(link.url, '_blank')}
          >
            {link.icon} {link.name}
          </Button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded">
          <Keyboard size={11} />
          <span>N</span><span className="text-muted-foreground/50">svar</span>
          <span>R</span><span className="text-muted-foreground/50">ring</span>
          <span>O</span><span className="text-muted-foreground/50">offert</span>
          <span>A</span><span className="text-muted-foreground/50">affär</span>
          <span>S</span><span className="text-muted-foreground/50">hoppa</span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_280px] gap-4 mb-4">
        {/* Subscriptions */}
        <Card className="border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Abonnemang</span>
              <Badge className="bg-blue-500 text-white text-[10px]">{lead.subs?.length || 0} st</Badge>
            </div>
            {!lead.subs?.length ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Inga abonnemang</p>
            ) : (
              <div className="space-y-1.5">
                {lead.subs.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-blue-500 w-5">{i + 1}</span>
                      <div>
                        <span className="font-semibold text-sm">{s.user || 'Okänd'}</span>
                        <a href={toTel(s.phone)} className="ml-2 text-sm text-blue-600 font-mono hover:underline">
                          {fmtPhone(s.phone)}
                        </a>
                        <CopyBtn text={s.phone} label={`tel-${i}`} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.plan && <span className="text-xs text-muted-foreground">{s.plan}</span>}
                      <span className={cn("text-xs font-semibold", bindColor(s.end))}>{bindLabel(s.end)}</span>
                      <Button
                        size="sm"
                        className="h-7 rounded-full bg-green-500 hover:bg-green-600 text-xs px-3 shadow-sm"
                        onClick={() => window.open(toTel(s.phone), '_self')}
                      >
                        <Phone size={11} className="mr-1" />Ring
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact info */}
        <Card className="border-blue-100">
          <CardContent className="p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Kontakt</span>

            {/* Org-nr with copy */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Org: {fmtOrg(lead.orgnr)}</span>
              <CopyBtn text={lead.orgnr} label="orgnr" />
            </div>

            <div>
              <label className="text-[10px] text-blue-500 font-bold block mb-0.5">Beslutsfattare</label>
              <Input value={String(lead.vdName || '')} onChange={e => updateField('vdName', e.target.value)} placeholder="Namn..." className="h-8 text-sm border-blue-100 focus:border-blue-300" />
            </div>
            <div>
              <label className="text-[10px] text-blue-500 font-bold block mb-0.5">Direktnr</label>
              <div className="flex gap-1">
                <Input value={String(lead.vdPhone || '')} onChange={e => updateField('vdPhone', e.target.value)} placeholder="07X..." className="h-8 text-sm border-blue-100 focus:border-blue-300" />
                {lead.vdPhone && <CopyBtn text={lead.vdPhone} label="vdPhone" />}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-blue-500 font-bold block mb-0.5">E-post</label>
              <div className="flex gap-1">
                <Input value={String(lead.vdEmail || '')} onChange={e => updateField('vdEmail', e.target.value)} placeholder="namn@..." className="h-8 text-sm border-blue-100 focus:border-blue-300" />
                {lead.vdEmail && <CopyBtn text={lead.vdEmail} label="vdEmail" />}
              </div>
            </div>

            {/* Quick call button for decision maker */}
            {lead.vdPhone && (
              <Button
                className="w-full h-10 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg shadow-sm shadow-green-500/20"
                onClick={() => window.open(toTel(lead.vdPhone), '_self')}
              >
                <Phone size={14} className="mr-2" />
                Ring beslutsfattare
              </Button>
            )}

            {/* Main phone copy */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t">
              <span>Huvudnr: {fmtPhone(lead.phone)}</span>
              <CopyBtn text={lead.phone} label="mainPhone" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last interaction */}
      {lastNote && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm flex items-start gap-2">
          <CalendarClock size={14} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <span className="text-amber-700 font-semibold text-xs">Senaste: </span>
            <span className="text-amber-800">{lastNote.outcome}</span>
            {lastNote.note && <span className="text-amber-600 ml-1">— &quot;{lastNote.note}&quot;</span>}
            <span className="text-amber-400 ml-2 text-xs">{lastNote.date}</span>
          </div>
        </div>
      )}

      {/* Date picker overlay */}
      {showDatePicker && (
        <Card className="mb-4 border-2 border-blue-300 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CalendarClock size={18} className="text-blue-500" />
              <span className="font-bold text-sm">Ring senare — välj datum:</span>
              <Input
                type="date"
                value={callbackDate}
                onChange={e => setCallbackDate(e.target.value)}
                className="w-48 h-9"
                autoFocus
                min={new Date().toISOString().slice(0, 10)}
              />
              <Button size="sm" onClick={confirmCallback} disabled={!callbackDate} className="bg-blue-600 hover:bg-blue-700">
                Bekräfta
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowDatePicker(false)}>Avbryt</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TB input overlay */}
      {showTbInput && (
        <Card className="mb-4 border-2 border-green-300 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Trophy size={18} className="text-green-600" />
              <span className="font-bold text-sm">AFFÄR! Ange TB-belopp:</span>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={tbAmount}
                  onChange={e => setTbAmount(e.target.value)}
                  placeholder="T.ex. 2400"
                  className="w-36 h-9"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground">kr</span>
              </div>
              <Button size="sm" onClick={confirmOrder} className="bg-green-600 hover:bg-green-700">
                Stäng affär!
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowTbInput(false)}>Avbryt</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outcomes - color coded for psychology */}
      {!showDatePicker && !showTbInput && (
        <Card className="border-2 border-dashed border-muted">
          <CardContent className="p-5">
            <div className="grid grid-cols-5 gap-3">
              <Button
                variant="outline"
                onClick={() => handleOutcome('nosvar')}
                className="h-auto py-4 flex flex-col items-center gap-1.5 transition-all hover:bg-slate-50 hover:border-slate-300 group"
              >
                <PhoneMissed size={20} className="text-slate-400 group-hover:text-slate-500" />
                <span className="font-bold text-[11px] text-slate-500">Inget svar</span>
                <kbd className="text-[9px] text-muted-foreground/50 bg-muted px-1 rounded">N</kbd>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleOutcome('ringsenare')}
                className="h-auto py-4 flex flex-col items-center gap-1.5 transition-all hover:bg-blue-50 hover:border-blue-300 group"
              >
                <CalendarClock size={20} className="text-blue-500 group-hover:text-blue-600" />
                <span className="font-bold text-[11px] text-blue-600">Ring senare</span>
                <kbd className="text-[9px] text-muted-foreground/50 bg-muted px-1 rounded">R</kbd>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleOutcome('offert')}
                className="h-auto py-4 flex flex-col items-center gap-1.5 transition-all hover:bg-orange-50 hover:border-orange-300 group border-orange-200 bg-orange-50/30"
              >
                <FileText size={20} className="text-orange-500 group-hover:text-orange-600" />
                <span className="font-bold text-[11px] text-orange-600">Offert</span>
                <kbd className="text-[9px] text-muted-foreground/50 bg-muted px-1 rounded">O</kbd>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleOutcome('order')}
                className="h-auto py-4 flex flex-col items-center gap-1.5 transition-all border-green-300 bg-green-50 hover:bg-green-100 hover:border-green-400 hover:shadow-lg hover:shadow-green-100 hover:scale-[1.02] group"
              >
                <Trophy size={20} className="text-green-600 group-hover:text-green-700" />
                <span className="font-extrabold text-[12px] text-green-700">AFFÄR!</span>
                <kbd className="text-[9px] text-muted-foreground/50 bg-muted px-1 rounded">A</kbd>
              </Button>

              <Button
                variant="outline"
                onClick={() => handleOutcome('skip')}
                className="h-auto py-4 flex flex-col items-center gap-1.5 transition-all hover:bg-slate-50 group opacity-70 hover:opacity-100"
              >
                <SkipForward size={20} className="text-muted-foreground" />
                <span className="font-bold text-[11px] text-muted-foreground">Hoppa</span>
                <kbd className="text-[9px] text-muted-foreground/50 bg-muted px-1 rounded">S</kbd>
              </Button>
            </div>

            {/* Note with quick templates */}
            <div className="mt-3">
              <div className="flex gap-1.5 flex-wrap mb-2">
                {QUICK_NOTES.map(note => (
                  <button
                    key={note}
                    onClick={() => updateField('note', lead.note ? `${lead.note}, ${note.toLowerCase()}` : note)}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-muted hover:border-blue-300 hover:bg-blue-50 text-muted-foreground hover:text-blue-600 transition-colors"
                  >
                    {note}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Anteckning (valfritt)..."
                value={lead.note || ''}
                onChange={e => updateField('note', e.target.value)}
                className="h-10 resize-none text-sm border-blue-100 focus:border-blue-300"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
