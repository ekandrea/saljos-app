"use client";

import { useState, useEffect } from 'react';
import { Lead, ViewName } from '@/lib/types';
import { scoreLead, getAutopilotQueue } from '@/lib/scoring';
import { loadLeads, saveLeads, cloudPull, cloudPush, lockLead, unlockLead, getSellerName, setSellerName, isLoggedIn, logout } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { LoginScreen } from '@/components/app/login-screen';
import { Sidebar } from '@/components/app/sidebar';
import { DagensPlan } from '@/components/app/dagens-plan';
import { CustomerCard } from '@/components/app/customer-card';
import { PipelineView } from '@/components/app/pipeline-view';
import { LeadsView } from '@/components/app/leads-view';
import { DashboardView } from '@/components/app/dashboard-view';
import { SearchView } from '@/components/app/search-view';
import { SettingsView } from '@/components/app/settings-view';
import { ProspektView } from '@/components/app/prospekt-view';
import { ProspektDetail } from '@/components/app/prospekt-detail';

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [seller, setSeller] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<ViewName>('dialer');
  const [dialerOn, setDialerOn] = useState(false);
  const [dq, setDq] = useState<Lead[]>([]);
  const [di, setDi] = useState(0);
  const [stats, setStats] = useState({ calls: 0, offers: 0, orders: 0 });
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [prospektDetailId, setProspektDetailId] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Init: check if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      const s = getSellerName();
      setSeller(s);
      setLoggedIn(true);
      const local = loadLeads();
      setLeads(local);
      cloudPull().then(cloud => {
        if (cloud.length > 0) { setLeads(cloud); saveLeads(cloud); }
      });
      // Load pinned prospekts
      try {
        const pins = localStorage.getItem('saljos_pins_' + s);
        if (pins) setPinnedIds(JSON.parse(pins));
      } catch {}
    }
  }, []);

  // Auto-save & cloud sync
  useEffect(() => {
    if (!loggedIn || leads.length === 0) return;
    saveLeads(leads);
    const t = setTimeout(() => cloudPush(leads), 5000);
    return () => clearTimeout(t);
  }, [leads, loggedIn]);

  const handleLogin = (name: string) => {
    setSellerName(name);
    const s = name.toLowerCase().trim();
    setSeller(s);
    setLoggedIn(true);
    const local = loadLeads();
    setLeads(local);
    cloudPull().then(cloud => {
      if (cloud.length > 0) { setLeads(cloud); saveLeads(cloud); }
    });
  };

  const handleLogout = () => {
    cloudPush(leads);
    logout();
    setLoggedIn(false);
    setLeads([]);
  };

  const startAutopilot = () => {
    const q = getAutopilotQueue(leads, seller);
    const queue = [...q.callbacks, ...q.offers, ...q.scored].map(l => ({ ...l, score: scoreLead(l, seller) }));
    if (!queue.length) return;
    setDq(queue);
    setDi(0);
    setDialerOn(true);
    setStats({ calls: 0, offers: 0, orders: 0 });
    setLeads(lockLead(leads, queue[0].id, seller));
  };

  const stopDialer = () => {
    setDialerOn(false);
    setDq([]);
    setDi(0);
  };

  const handleOutcome = (type: string, extra?: { date?: string; tb?: number }) => {
    const cur = leads.find(l => l.id === dq[di]?.id);
    if (!cur) return;
    const updated = [...leads];
    const idx = updated.findIndex(l => l.id === cur.id);
    const lead = { ...updated[idx] };
    const today = new Date().toISOString().slice(0, 10);

    if (type === 'nosvar') {
      lead.status = 'ej_svar';
      const d = new Date();
      d.setHours(d.getHours() + 2);
      lead.nextCallDate = d.toISOString();
      lead.history = [...lead.history, { date: today, outcome: 'Ej svar \u2013 \u00e5ter om 2h', note: lead.note || '', seller }];
      setStats(s => ({ ...s, calls: s.calls + 1 }));
    } else if (type === 'ringsenare') {
      const d = extra?.date;
      if (!d) return;
      lead.status = 'ring_senare';
      lead.nextCallDate = d;
      lead.history = [...lead.history, { date: today, outcome: 'Ring senare: ' + d, note: lead.note || '', seller }];
      setStats(s => ({ ...s, calls: s.calls + 1 }));
    } else if (type === 'offert') {
      lead.status = 'offert';
      lead.offerSent = true;
      lead.seller = seller;
      lead.history = [...lead.history, { date: today, outcome: 'Offert skickad', note: lead.note || '', seller }];
      setStats(s => ({ ...s, calls: s.calls + 1, offers: s.offers + 1 }));
    } else if (type === 'order') {
      lead.status = 'order';
      lead.seller = seller;
      lead.tb_amount = extra?.tb || 0;
      lead.history = [...lead.history, { date: today, outcome: `\u2705 Order! TB: ${extra?.tb || 0} kr`, note: lead.note || '', seller }];
      setStats(s => ({ ...s, calls: s.calls + 1, orders: s.orders + 1 }));
    }

    lead.lockedBy = null;
    lead.lockedAt = null;
    updated[idx] = lead;

    const next = di + 1;
    if (next < dq.length) {
      const u = lockLead(updated, dq[next].id, seller);
      setLeads(u);
      setDi(next);
    } else {
      setLeads(updated);
      setDialerOn(false);
    }
  };

  const openLead = (id: number) => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    setDq([{ ...lead, score: scoreLead(lead, seller) }]);
    setDi(0);
    setDialerOn(true);
    setLeads(lockLead(leads, id, seller));
    setView('dialer');
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCalls = leads.flatMap(l => l.history || []).filter(e => e.date === todayStr && e.seller === seller).length;
  const todayOrders = leads.flatMap(l => l.history || []).filter(e => e.date === todayStr && e.seller === seller && e.outcome.includes('Order')).length;

  const togglePin = (id: number) => {
    const next = pinnedIds.includes(id) ? pinnedIds.filter(p => p !== id) : [...pinnedIds, id];
    setPinnedIds(next);
    try { localStorage.setItem('saljos_pins_' + seller, JSON.stringify(next)); } catch {}
  };

  const convertToLead = (id: number) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: 'ny' } : l));
    setPinnedIds(pinnedIds.filter(p => p !== id));
    try { localStorage.setItem('saljos_pins_' + seller, JSON.stringify(pinnedIds.filter(p => p !== id))); } catch {}
    setProspektDetailId(null);
  };

  const badges = {
    dialer: getAutopilotQueue(leads, seller).total,
    pipeline: leads.filter(l => l.seller === seller && ['offert', 'apg'].includes(l.status)).length,
    leads: leads.filter(l => !['blacklist', 'prospekt'].includes(l.status)).length,
    prospekt: leads.filter(l => l.status === 'prospekt').length,
  };

  if (!loggedIn) return <LoginScreen onLogin={handleLogin} />;

  const cur = dialerOn && dq[di] ? leads.find(l => l.id === dq[di].id) : null;

  return (
    <div className="flex h-full">
      <Sidebar
        view={view}
        onNavigate={v => { if (dialerOn) stopDialer(); setProspektDetailId(null); setView(v); }}
        badges={badges}
        seller={seller}
        onLogout={handleLogout}
        todayCalls={todayCalls}
        todayOrders={todayOrders}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <main className={cn("flex-1 p-8 min-h-screen bg-background transition-all duration-200", sidebarCollapsed ? "ml-[60px]" : "ml-[240px]")}>
        {view === 'dialer' && !dialerOn && (
          <DagensPlan leads={leads} seller={seller} onStart={startAutopilot} />
        )}
        {view === 'dialer' && dialerOn && cur && (
          <>
            <CustomerCard lead={cur} leads={leads} seller={seller} onUpdate={setLeads} onStop={stopDialer} onNext={handleOutcome} />
            <div className={cn("fixed bottom-0 right-0 bg-gradient-to-r from-[#0c0c14] to-[#151530] px-6 py-3 flex items-center gap-4 z-40 transition-all duration-200", sidebarCollapsed ? "left-[60px]" : "left-[240px]")}>
              <Progress value={dq.length ? ((di + 1) / dq.length) * 100 : 0} className="flex-1 h-1.5" />
              <div className="flex gap-4 text-xs font-bold text-white whitespace-nowrap">
                <span>Samtal: {stats.calls}</span>
                <span className="text-orange-400">Offerter: {stats.offers}</span>
                <span className="text-green-400">Ordrar: {stats.orders}</span>
                <span className="text-slate-400 font-normal">{di + 1} av {dq.length}</span>
              </div>
            </div>
          </>
        )}
        {view === 'pipeline' && (
          <PipelineView leads={leads} seller={seller} onOpenLead={openLead} onUnlock={id => setLeads(unlockLead(leads, id, seller))} />
        )}
        {view === 'leads' && (
          <LeadsView leads={leads} seller={seller} onOpenLead={openLead} />
        )}
        {view === 'dash' && (
          <DashboardView leads={leads} seller={seller} />
        )}
        {view === 'prospekt' && !prospektDetailId && (
          <ProspektView
            leads={leads}
            pinnedIds={pinnedIds}
            onTogglePin={togglePin}
            onOpenProspekt={id => setProspektDetailId(id)}
            onConvertToLead={convertToLead}
          />
        )}
        {view === 'prospekt' && prospektDetailId && (() => {
          const pl = leads.find(l => l.id === prospektDetailId);
          return pl ? (
            <ProspektDetail
              lead={pl}
              isPinned={pinnedIds.includes(pl.id)}
              onTogglePin={() => togglePin(pl.id)}
              onBack={() => setProspektDetailId(null)}
              onConvertToLead={() => convertToLead(pl.id)}
            />
          ) : null;
        })()}
        {view === 'sok' && (
          <SearchView leads={leads} onOpenLead={openLead} />
        )}
        {view === 'settings' && (
          <SettingsView leads={leads} onUpdateLeads={setLeads} />
        )}
      </main>
    </div>
  );
}
