"use client";

import { useState, useEffect } from 'react';
import { Lead, ViewName, STATUS_LABELS, INDUSTRY_LABELS, TARGET_INDUSTRIES } from '@/lib/types';
import { scoreLead, getAutopilotQueue, bindLabel, bindColor } from '@/lib/scoring';
import { cn, fmtPhone, fmtOrg, normOrg, toTel, getGreeting, fmtDate } from '@/lib/utils';
import { loadLeads, saveLeads, cloudPull, cloudPush, lockLead, unlockLead, getSellerName, setSellerName, isLoggedIn, logout, getPassword } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Zap, GitBranch, Users, BarChart3, Search, Settings, LogOut, Phone, PhoneMissed, CalendarClock, FileText, Trophy, SkipForward, ArrowLeft, ExternalLink, Unlock } from 'lucide-react';

function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState(false);
  const handleLogin = () => {
    if (!name.trim()) { setError(true); return; }
    if (pw !== getPassword()) { setError(true); setPw(''); return; }
    onLogin(name.trim());
  };
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#0c0c14] via-[#151530] to-[#1e1450] flex items-center justify-center z-50">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(91,95,199,.15),transparent_70%)] rounded-full" />
      <Card className="w-[400px] border-0 shadow-2xl relative z-10">
        <CardContent className="pt-10 pb-10 px-10 text-center">
          <div className="text-5xl mb-2">⚡</div>
          <h2 className="text-2xl font-extrabold tracking-tight mb-1">Säljös</h2>
          <p className="text-sm text-muted-foreground mb-8">Sales OS — unified B2B sales dashboard</p>
          <Input placeholder="Ditt namn" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && document.getElementById('pw')?.focus()} className="mb-3 text-center" />
          <Input id="pw" type="password" placeholder="Lösenord" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} className="mb-4 text-center" />
          <Button onClick={handleLogin} className="w-full h-12 text-sm font-bold bg-gradient-to-r from-[#5b5fc7] to-[#7c7ff2] hover:opacity-90">Logga in</Button>
          {error && <p className="text-red-500 text-xs mt-3">Fel lösenord eller namn saknas</p>}
        </CardContent>
      </Card>
    </div>
  );
}

const NAV_ITEMS: { view: ViewName; icon: React.ReactNode; label: string; badgeKey?: string }[] = [
  { view: 'dialer', icon: <Zap size={16} />, label: 'Dialer', badgeKey: 'dialer' },
  { view: 'pipeline', icon: <GitBranch size={16} />, label: 'Pipeline', badgeKey: 'pipeline' },
  { view: 'leads', icon: <Users size={16} />, label: 'Leads', badgeKey: 'leads' },
  { view: 'dash', icon: <BarChart3 size={16} />, label: 'Dashboard' },
  { view: 'sok', icon: <Search size={16} />, label: 'Sök' },
];

function Sidebar({ view, onNavigate, badges, seller, onLogout }: { view: ViewName; onNavigate: (v: ViewName) => void; badges: Record<string, number>; seller: string; onLogout: () => void }) {
  const displayName = seller.charAt(0).toUpperCase() + seller.slice(1);
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-[#0c0c14] text-white flex flex-col z-50">
      <div className="px-5 pt-5 pb-3 flex items-center gap-2.5">
        <span className="text-xl">⚡</span>
        <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#a5a8f8] to-[#7c7ff2] bg-clip-text text-transparent">Säljös</span>
      </div>
      <div className="mx-3.5 mb-3 bg-gradient-to-r from-[rgba(91,95,199,.15)] to-[rgba(124,127,242,.08)] border border-[rgba(91,95,199,.2)] rounded-xl p-2.5 flex items-center gap-2">
        <Avatar className="h-7 w-7"><AvatarFallback className="bg-gradient-to-r from-[#5b5fc7] to-[#7c7ff2] text-xs font-bold">{displayName[0]}</AvatarFallback></Avatar>
        <div><div className="text-xs font-bold">{displayName}</div><div className="text-[10px] text-[#666]">Sales rep</div></div>
      </div>
      <div className="px-4 pt-2 pb-1 text-[9px] uppercase tracking-[2px] text-[#2a2a3a] font-bold">Huvudmeny</div>
      <nav className="flex-1">
        {NAV_ITEMS.map(item => (
          <button key={item.view} onClick={() => onNavigate(item.view)} className={cn("w-full flex items-center gap-2.5 px-5 py-2.5 text-[13px] font-medium transition-all border-l-[3px] border-transparent mr-2 rounded-r-lg", view === item.view ? "border-l-[#7c7ff2] bg-gradient-to-r from-[rgba(91,95,199,.15)] to-[rgba(124,127,242,.08)] text-white font-semibold" : "text-[#777] hover:bg-white/[.06] hover:text-[#ccc]")}>
            {item.icon}{item.label}
            {item.badgeKey && badges[item.badgeKey] > 0 && <Badge className="ml-auto text-[9px] px-1.5 py-0 bg-[#5b5fc7] hover:bg-[#5b5fc7]">{badges[item.badgeKey]}</Badge>}
          </button>
        ))}
      </nav>
      <div className="border-t border-[#111827] p-3 space-y-0.5">
        <button onClick={() => onNavigate('settings')} className="w-full flex items-center gap-2.5 px-5 py-2 text-[13px] text-[#777] hover:text-[#ccc]"><Settings size={16} /> Inställningar</button>
        <button onClick={onLogout} className="w-full flex items-center gap-2.5 px-5 py-2 text-[13px] text-red-400 hover:text-red-300"><LogOut size={16} /> Logga ut</button>
      </div>
    </aside>
  );
}

function DagensPlan({ leads, seller, onStart }: { leads: Lead[]; seller: string; onStart: () => void }) {
  const q = getAutopilotQueue(leads, seller);
  return (
    <div>
      <div className="bg-gradient-to-br from-[#0c0c14] via-[#151530] to-[#1e1450] rounded-2xl p-12 relative overflow-hidden mb-6">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(91,95,199,.12),transparent_70%)] rounded-full" />
        <div className="relative z-10">
          <p className="text-sm text-white/50 mb-1">{getGreeting()}</p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-6">{seller.charAt(0).toUpperCase() + seller.slice(1)} 👋</h1>
          <div className="flex gap-4 flex-wrap mb-8">
            <Card className="bg-red-500/15 border-red-500/25 min-w-[140px]"><CardContent className="p-4"><div className="text-3xl font-extrabold text-red-500">{q.callbacks.length}</div><div className="text-xs text-white/60 mt-1">Återkomster</div></CardContent></Card>
            <Card className="bg-orange-500/15 border-orange-500/25 min-w-[140px]"><CardContent className="p-4"><div className="text-3xl font-extrabold text-orange-500">{q.offers.length}</div><div className="text-xs text-white/60 mt-1">Offerter att följa upp</div></CardContent></Card>
            <Card className="bg-green-500/15 border-green-500/25 min-w-[140px]"><CardContent className="p-4"><div className="text-3xl font-extrabold text-green-500">{q.scored.length}</div><div className="text-xs text-white/60 mt-1">Leads redo</div></CardContent></Card>
          </div>
          <Button onClick={onStart} size="lg" className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-base px-12 h-14 rounded-xl shadow-lg shadow-green-500/25">▶ BÖRJA DAGEN</Button>
        </div>
      </div>
      {q.callbacks.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Först ut — återkomster</h3>
          <div className="space-y-2">{q.callbacks.slice(0, 3).map(l => (
            <Card key={l.id} className="hover:shadow-md transition-shadow"><CardContent className="p-4 flex items-center justify-between">
              <div><div className="font-bold text-sm">{l.company}</div><div className="text-xs text-muted-foreground">{fmtPhone(l.phone)} · {INDUSTRY_LABELS[l.industry] || l.industry}</div></div>
              <div className="flex items-center gap-2"><Badge variant="outline">{l.operator}</Badge><span className={cn("text-xs", bindColor(l.bindingDate))}>{bindLabel(l.bindingDate)}</span></div>
            </CardContent></Card>
          ))}</div>
        </div>
      )}
    </div>
  );
}

function CustomerCard({ lead, leads, seller, onUpdate, onStop, onNext }: { lead: Lead; leads: Lead[]; seller: string; onUpdate: (l: Lead[]) => void; onStop: () => void; onNext: (o: string) => void }) {
  const updateField = (field: keyof Lead, value: string) => { onUpdate(leads.map(l => l.id === lead.id ? { ...l, [field]: value } : l)); };
  return (
    <div className="space-y-4 pb-24">
      <Card className="bg-gradient-to-br from-[#f8f7ff] to-white border-[#e8e6f0] shadow-sm">
        <CardContent className="p-7">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">{lead.company}</h2>
              <div className="flex gap-2 items-center mt-2 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono">{fmtOrg(lead.orgnr)}</span>
                <Badge variant="secondary">{INDUSTRY_LABELS[lead.industry] || lead.industry}</Badge>
                <Badge variant="outline">{lead.operator || 'Okänd'}</Badge>
                <span className={cn("text-xs", bindColor(lead.bindingDate))}>{bindLabel(lead.bindingDate)}</span>
              </div>
            </div>
            <Button variant="outline" onClick={onStop}><ArrowLeft size={14} className="mr-1" /> Tillbaka</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Allabolag','Merinfo','LinkedIn','Google','Upsales','GetAccept'].map(name => (
              <Button key={name} variant="ghost" size="sm" className="text-xs h-7 px-2.5 bg-muted/50" onClick={() => {
                const urls: Record<string,string> = { Allabolag:`https://www.allabolag.se/${normOrg(lead.orgnr)}`, Merinfo:`https://www.merinfo.se/search?q=${encodeURIComponent(fmtOrg(lead.orgnr))}`, LinkedIn:`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(lead.company)}`, Google:`https://www.google.com/search?q=${encodeURIComponent(lead.company)}`, Upsales:'https://crm.upsales.com/', GetAccept:'https://app.getaccept.com/' };
                window.open(urls[name],'_blank');
              }}>{name}</Button>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-[340px_1fr] gap-5">
        <Card><CardContent className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kontaktuppgifter</h3>
          {[{l:'Beslutsfattare',f:'vdName' as keyof Lead,p:'Namn...'},{l:'Direktnummer',f:'vdPhone' as keyof Lead,p:'07X-XXX XX XX'},{l:'E-post',f:'vdEmail' as keyof Lead,p:'namn@foretag.se'}].map(({l,f,p})=>(
            <div key={f}><label className="text-[10px] font-bold uppercase tracking-wider text-[#5b5fc7] mb-1 block">{l}</label><Input value={String(lead[f]||'')} onChange={e=>updateField(f,e.target.value)} placeholder={p}/></div>
          ))}
          <div><label className="text-[10px] font-bold uppercase tracking-wider text-[#5b5fc7] mb-1 block">Webbplats</label>
            <div className="flex gap-2"><Input value={lead.website||''} onChange={e=>updateField('website',e.target.value)} placeholder="www..."/><Button variant="outline" size="icon" onClick={()=>{let u=lead.website;if(u&&!u.startsWith('http'))u='https://'+u;if(u)window.open(u,'_blank');}}><ExternalLink size={14}/></Button></div>
          </div>
        </CardContent></Card>
        <div>
          <div className="flex items-center gap-2 mb-3"><h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Abonnemang</h3><Badge className="bg-[#5b5fc7] text-white text-[10px]">{lead.subs?.length||0}</Badge></div>
          {!lead.subs?.length ? <Card className="bg-muted/30"><CardContent className="p-8 text-center text-muted-foreground text-sm">Inga abonnemang</CardContent></Card> : (
            <div className="space-y-2">{lead.subs.map((s,i)=>(
              <Card key={i} className="hover:shadow-md transition-shadow"><CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] flex items-center justify-center text-sm font-bold text-[#5b5fc7]">{i+1}</div>
                  <div><div className="font-semibold text-sm">{s.user||'Okänd'}</div><a href={toTel(s.phone)} className="text-xs text-[#5b5fc7] font-semibold hover:underline">{fmtPhone(s.phone)}</a></div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs",bindColor(s.end))}>{bindLabel(s.end)}</span>
                  <Button size="sm" className="rounded-full bg-green-500 hover:bg-green-600" onClick={()=>window.open(toTel(s.phone),'_self')}><Phone size={12} className="mr-1"/>Ring</Button>
                </div>
              </CardContent></Card>
            ))}</div>
          )}
        </div>
      </div>
      <Card><CardContent className="p-6">
        <h3 className="font-bold text-sm mb-4">Hur gick samtalet?</h3>
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[{k:'nosvar',icon:<PhoneMissed size={22} className="text-muted-foreground"/>,l:'Inget svar',s:'Åter om 2h'},{k:'ringsenare',icon:<CalendarClock size={22} className="text-[#5b5fc7]"/>,l:'Ring senare',s:'Välj datum'},{k:'offert',icon:<FileText size={22} className="text-orange-500"/>,l:'Offert',s:'Skicka offert'},{k:'order',icon:<Trophy size={22} className="text-green-600"/>,l:'AFFÄR!',s:'Registrera',c:'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50'}].map(o=>(
            <Button key={o.k} variant="outline" onClick={()=>onNext(o.k)} className={cn("h-auto py-5 flex flex-col items-center gap-1.5 hover:shadow-md transition-all",o.c)}>
              {o.icon}<span className="font-bold text-xs">{o.l}</span><span className="text-[10px] text-muted-foreground">{o.s}</span>
            </Button>
          ))}
        </div>
        <div className="flex gap-3">
          <Textarea placeholder="Anteckning..." value={lead.note||''} onChange={e=>updateField('note',e.target.value)} className="h-12 resize-none"/>
          <Button variant="outline" onClick={()=>onNext('skip')} className="whitespace-nowrap px-4"><SkipForward size={14} className="mr-1"/>Hoppa</Button>
        </div>
      </CardContent></Card>
    </div>
  );
}

function PipelineView({ leads, seller, onOpenLead, onUnlock }: { leads: Lead[]; seller: string; onOpenLead: (id: number) => void; onUnlock: (id: number) => void }) {
  const callbacks = leads.filter(l=>l.nextCallDate&&new Date(l.nextCallDate)<=new Date()&&!['blacklist','order','prospekt'].includes(l.status)&&l.seller===seller);
  const offers = leads.filter(l=>['offert','apg'].includes(l.status)&&l.seller===seller);
  const active = leads.filter(l=>l.lockedBy===seller&&!['blacklist','order','prospekt'].includes(l.status));
  const PCard = ({l}:{l:Lead}) => (
    <Card className="hover:shadow-md hover:border-[#5b5fc7] transition-all cursor-pointer" onClick={()=>onOpenLead(l.id)}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2"><div><div className="font-bold text-sm">{l.company}</div><div className="flex gap-2 items-center mt-1"><Badge variant="secondary" className="text-[10px]">{INDUSTRY_LABELS[l.industry]||l.industry}</Badge><span className="text-xs text-muted-foreground">{fmtPhone(l.phone)}</span></div></div><Badge variant="outline">{STATUS_LABELS[l.status]}</Badge></div>
        {l.nextCallDate&&<div className="text-xs text-[#5b5fc7] font-semibold mb-2"><CalendarClock size={12} className="inline mr-1"/>{fmtDate(l.nextCallDate)}</div>}
        <div className="flex gap-2"><Button size="sm" className="flex-1" onClick={e=>{e.stopPropagation();onOpenLead(l.id)}}>Öppna</Button><Button size="sm" variant="outline" onClick={e=>{e.stopPropagation();onUnlock(l.id)}}><Unlock size={13}/></Button></div>
      </CardContent>
    </Card>
  );
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-[#5b5fc7] bg-clip-text text-transparent">Pipeline</h1>
      {[{t:'Återkomster idag',items:callbacks,c:'bg-red-500'},{t:'Offerter ute',items:offers,c:'bg-orange-500'},{t:'Aktiva leads',items:active,c:'bg-[#5b5fc7]'}].map(s=>(
        <div key={s.t}><div className="flex items-center gap-2 mb-3"><div className={cn("w-1 h-4 rounded",s.c)}/><h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{s.t}</h3></div>
          {s.items.length?<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">{s.items.map(l=><PCard key={l.id} l={l}/>)}</div>:<p className="text-sm text-muted-foreground pl-3">Inga {s.t.toLowerCase()}.</p>}
        </div>
      ))}
    </div>
  );
}

function LeadsView({ leads, seller, onOpenLead }: { leads: Lead[]; seller: string; onOpenLead: (id: number) => void }) {
  const [search, setSearch] = useState('');
  const [sf, setSf] = useState('alla');
  const filtered = leads.filter(l=>{if(l.status==='blacklist'||l.status==='prospekt')return false;if(sf!=='alla'&&l.status!==sf)return false;if(search){const s=`${l.company} ${l.orgnr} ${l.phone} ${l.contact}`.toLowerCase();if(!s.includes(search.toLowerCase()))return false;}return true;}).sort((a,b)=>scoreLead(b,seller)-scoreLead(a,seller));
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-[#5b5fc7] bg-clip-text text-transparent mb-4">Leads</h1>
      <Input placeholder="Sök bolagsnamn, org-nr, telefon..." value={search} onChange={e=>setSearch(e.target.value)} className="max-w-[280px] mb-3"/>
      <div className="flex gap-1.5 flex-wrap mb-4">{['alla','ny','ring_senare','offert','order','avslutad','inte_intresserad','ej_svar'].map(s=>(
        <Button key={s} variant={sf===s?"default":"outline"} size="sm" className="text-xs h-7" onClick={()=>setSf(s)}>{s==='alla'?'Alla':STATUS_LABELS[s]}</Button>
      ))}</div>
      <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full">
        <thead><tr className="border-b-2 border-muted bg-muted/30">
          {['Bolagsnamn','Telefon','Operatör','Bindning','Status','Poäng'].map(h=><th key={h} className={cn("p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground",h==='Poäng'?'text-right':'text-left')}>{h}</th>)}
        </tr></thead>
        <tbody>{filtered.slice(0,50).map(l=>(
          <tr key={l.id} className="border-b border-muted/50 hover:bg-gradient-to-r hover:from-[#f5f3ff] hover:to-transparent cursor-pointer transition-colors" onClick={()=>onOpenLead(l.id)}>
            <td className="p-3"><div className="font-semibold text-sm">{l.company}{TARGET_INDUSTRIES.includes(l.industry)&&<Badge className="ml-1.5 text-[9px] bg-green-500">⭐</Badge>}</div><div className="text-xs text-muted-foreground">{l.contact}</div></td>
            <td className="p-3 text-sm">{fmtPhone(l.phone)}</td>
            <td className="p-3"><Badge variant="outline" className="text-[10px]">{l.operator||'Okänd'}</Badge></td>
            <td className="p-3"><span className={cn("text-xs",bindColor(l.bindingDate))}>{bindLabel(l.bindingDate)}</span></td>
            <td className="p-3"><Badge variant="secondary" className="text-[10px]">{STATUS_LABELS[l.status]||l.status}</Badge></td>
            <td className="p-3 text-right font-bold text-[#5b5fc7]">{scoreLead(l,seller)>0?scoreLead(l,seller):'—'}</td>
          </tr>
        ))}</tbody>
      </table></div></Card>
      <p className="text-xs text-muted-foreground mt-2 text-center">{filtered.length} leads</p>
    </div>
  );
}

function DashboardView({ leads, seller }: { leads: Lead[]; seller: string }) {
  const orders = leads.filter(l=>l.status==='order'&&l.seller===seller);
  const totalTB = orders.reduce((s,l)=>s+(l.tb_amount||0),0);
  const tbPct = Math.min((totalTB/50000)*100,100);
  const todayCalls = leads.flatMap(l=>l.history||[]).filter(e=>e.date===new Date().toISOString().slice(0,10)).length;
  const kpis = [
    {l:'TB Denna Månad',v:`${totalTB.toLocaleString('sv-SE')} kr`,c:'border-l-violet-500',s:`${Math.round(tbPct)}% av 50k`,bar:tbPct},
    {l:'Samtal Idag',v:todayCalls,c:'border-l-blue-500',s:''},
    {l:'Ordrar',v:orders.length,c:'border-l-green-500',s:`${orders.filter(l=>l.deal_type==='nyteck').length} nyteck`},
    {l:'Offerter',v:leads.filter(l=>l.status==='offert'&&l.seller===seller).length,c:'border-l-orange-500',s:'Väntar på svar'},
    {l:'Återkomster',v:leads.filter(l=>l.nextCallDate&&new Date(l.nextCallDate)<=new Date()&&l.seller===seller).length,c:'border-l-red-500',s:''},
    {l:'Prio-leads',v:leads.filter(l=>TARGET_INDUSTRIES.includes(l.industry)&&scoreLead(l,seller)>0).length,c:'border-l-pink-500',s:'Högsta potential'},
  ];
  return (
    <div className="bg-gradient-to-b from-[#0a0f1c] to-[#050810] min-h-screen rounded-2xl p-8 text-white">
      <div className="flex justify-between items-center mb-8 pb-5 border-b border-blue-500/20">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">SÄLJÖS DASHBOARD</h1>
        <span className="text-sm text-slate-400">{new Date().toLocaleDateString('sv-SE',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map(k=>(
          <Card key={k.l} className={cn("bg-gradient-to-br from-[#111827] to-[#0b1220] border-[rgba(59,130,246,.2)] border-l-4",k.c)}>
            <CardContent className="p-7"><div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-3">{k.l}</div><div className="text-4xl font-extrabold text-white mb-2">{k.v}</div><div className="text-sm text-slate-500">{k.s}</div>
              {k.bar!==undefined&&<div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full transition-all" style={{width:`${k.bar}%`}}/></div>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SearchView({ leads, onOpenLead }: { leads: Lead[]; onOpenLead: (id: number) => void }) {
  const [q, setQ] = useState('');
  const results = q.length>=2?leads.filter(l=>`${l.company} ${l.orgnr} ${l.phone}`.toLowerCase().includes(q.toLowerCase())):[];
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-[#5b5fc7] bg-clip-text text-transparent mb-4">Sök</h1>
      <Input placeholder="Sök bolagsnamn, org-nr eller telefon..." value={q} onChange={e=>setQ(e.target.value)} className="text-base p-4 mb-4"/>
      <div className="space-y-2">{results.map(l=>(
        <Card key={l.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={()=>onOpenLead(l.id)}><CardContent className="p-4 flex justify-between items-center">
          <div><div className="font-bold text-sm">{l.company}</div><div className="text-xs text-muted-foreground">{fmtOrg(l.orgnr)} · {fmtPhone(l.phone)}</div></div>
          <div className="flex gap-2"><Badge variant="outline">{l.operator}</Badge><Badge variant="secondary">{STATUS_LABELS[l.status]}</Badge></div>
        </CardContent></Card>
      ))}</div>
    </div>
  );
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [seller, setSeller] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<ViewName>('dialer');
  const [dialerOn, setDialerOn] = useState(false);
  const [dq, setDq] = useState<Lead[]>([]);
  const [di, setDi] = useState(0);
  const [stats, setStats] = useState({calls:0,offers:0,orders:0});

  useEffect(()=>{
    if(isLoggedIn()){const s=getSellerName();setSeller(s);setLoggedIn(true);const local=loadLeads();setLeads(local);cloudPull().then(cloud=>{if(cloud.length>0){setLeads(cloud);saveLeads(cloud);}});}
  },[]);

  useEffect(()=>{if(!loggedIn||leads.length===0)return;saveLeads(leads);const t=setTimeout(()=>cloudPush(leads),5000);return()=>clearTimeout(t);},[leads,loggedIn]);

  const handleLogin=(name:string)=>{setSellerName(name);const s=name.toLowerCase().trim();setSeller(s);setLoggedIn(true);const local=loadLeads();setLeads(local);cloudPull().then(cloud=>{if(cloud.length>0){setLeads(cloud);saveLeads(cloud);}});};
  const handleLogout=()=>{cloudPush(leads);logout();setLoggedIn(false);setLeads([]);};

  const startAutopilot=()=>{const q=getAutopilotQueue(leads,seller);const queue=[...q.callbacks,...q.offers,...q.scored].map(l=>({...l,score:scoreLead(l,seller)}));if(!queue.length)return;setDq(queue);setDi(0);setDialerOn(true);setStats({calls:0,offers:0,orders:0});setLeads(lockLead(leads,queue[0].id,seller));};
  const stopDialer=()=>{setDialerOn(false);setDq([]);setDi(0);};

  const handleOutcome=(type:string)=>{
    const cur=leads.find(l=>l.id===dq[di]?.id);if(!cur)return;
    const updated=[...leads];const idx=updated.findIndex(l=>l.id===cur.id);const lead={...updated[idx]};
    if(type==='nosvar'){lead.status='ej_svar';const d=new Date();d.setHours(d.getHours()+2);lead.nextCallDate=d.toISOString();lead.history=[...lead.history,{date:new Date().toISOString().slice(0,10),outcome:'Ej svar – åter om 2h',note:lead.note||'',seller}];setStats(s=>({...s,calls:s.calls+1}));}
    else if(type==='ringsenare'){const d=prompt('Ringdatum (YYYY-MM-DD):');if(!d)return;lead.status='ring_senare';lead.nextCallDate=d;lead.history=[...lead.history,{date:new Date().toISOString().slice(0,10),outcome:'Ring senare: '+d,note:lead.note||'',seller}];setStats(s=>({...s,calls:s.calls+1}));}
    else if(type==='offert'){lead.status='offert';lead.offerSent=true;lead.seller=seller;lead.history=[...lead.history,{date:new Date().toISOString().slice(0,10),outcome:'Offert skickad',note:lead.note||'',seller}];setStats(s=>({...s,calls:s.calls+1,offers:s.offers+1}));}
    else if(type==='order'){lead.status='order';lead.seller=seller;lead.history=[...lead.history,{date:new Date().toISOString().slice(0,10),outcome:'✅ Order!',note:lead.note||'',seller}];setStats(s=>({...s,calls:s.calls+1,orders:s.orders+1}));}
    lead.lockedBy=null;lead.lockedAt=null;updated[idx]=lead;
    const next=di+1;if(next<dq.length){const u=lockLead(updated,dq[next].id,seller);setLeads(u);setDi(next);}else{setLeads(updated);setDialerOn(false);}
  };

  const openLead=(id:number)=>{const lead=leads.find(l=>l.id===id);if(!lead)return;setDq([{...lead,score:scoreLead(lead,seller)}]);setDi(0);setDialerOn(true);setLeads(lockLead(leads,id,seller));setView('dialer');};
  const badges={dialer:getAutopilotQueue(leads,seller).total,pipeline:leads.filter(l=>l.seller===seller&&['offert','apg'].includes(l.status)).length,leads:leads.filter(l=>!['blacklist','prospekt'].includes(l.status)).length};

  if(!loggedIn)return<LoginScreen onLogin={handleLogin}/>;
  const cur=dialerOn&&dq[di]?leads.find(l=>l.id===dq[di].id):null;

  return(
    <div className="flex h-full">
      <Sidebar view={view} onNavigate={v=>{if(dialerOn)stopDialer();setView(v);}} badges={badges} seller={seller} onLogout={handleLogout}/>
      <main className="ml-[260px] flex-1 p-8 min-h-screen bg-background">
        {view==='dialer'&&!dialerOn&&<DagensPlan leads={leads} seller={seller} onStart={startAutopilot}/>}
        {view==='dialer'&&dialerOn&&cur&&<>
          <CustomerCard lead={cur} leads={leads} seller={seller} onUpdate={setLeads} onStop={stopDialer} onNext={handleOutcome}/>
          <div className="fixed bottom-0 left-[260px] right-0 bg-gradient-to-r from-[#0c0c14] to-[#151530] px-6 py-3 flex items-center gap-4 z-40">
            <Progress value={dq.length?((di+1)/dq.length)*100:0} className="flex-1 h-1.5"/>
            <div className="flex gap-4 text-xs font-bold text-white whitespace-nowrap">
              <span>Samtal: {stats.calls}</span><span className="text-orange-400">Offerter: {stats.offers}</span><span className="text-green-400">Ordrar: {stats.orders}</span>
              <span className="text-slate-400 font-normal">{di+1} av {dq.length}</span>
            </div>
          </div>
        </>}
        {view==='pipeline'&&<PipelineView leads={leads} seller={seller} onOpenLead={openLead} onUnlock={id=>setLeads(unlockLead(leads,id,seller))}/>}
        {view==='leads'&&<LeadsView leads={leads} seller={seller} onOpenLead={openLead}/>}
        {view==='dash'&&<DashboardView leads={leads} seller={seller}/>}
        {view==='sok'&&<SearchView leads={leads} onOpenLead={openLead}/>}
        {view==='settings'&&<div><h1 className="text-2xl font-extrabold tracking-tight mb-4">Inställningar</h1><Card><CardContent className="p-6"><h3 className="font-bold mb-4">Datahantering</h3><div className="flex gap-3"><Button variant="outline" onClick={()=>cloudPush(leads)}>Synka nu</Button><Button variant="outline" onClick={()=>{const b=new Blob([JSON.stringify({leads},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='saljos_backup.json';a.click();}}>Exportera</Button></div></CardContent></Card></div>}
      </main>
    </div>
  );
}
