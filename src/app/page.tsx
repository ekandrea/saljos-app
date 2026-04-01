"use client";

import { useState, useEffect, useCallback } from 'react';
import { Lead, ViewName } from '@/lib/types';
import { scoreLead, getAutopilotQueue } from '@/lib/scoring';
import { fetchLeads, updateLead, lockLeadLocal, unlockLeadLocal, fetchPins, addPin, removePin } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
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
  const { seller: authSeller, loading: authLoading, logout } = useAuth();
  const seller = authSeller?.name || '';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [view, setView] = useState<ViewName>('dialer');
  const [dialerOn, setDialerOn] = useState(false);
  const [dq, setDq] = useState<Lead[]>([]);
  const [di, setDi] = useState(0);
  const [stats, setStats] = useState({ calls: 0, offers: 0, orders: 0 });
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [prospektDetailId, setProspektDetailId] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Load leads from API when logged in
  const loadData = useCallback(async () => {
    if (!authSeller) return;
    setDataLoading(true);
    const [leadsData, pinsData] = await Promise.all([fetchLeads(), fetchPins()]);
    setLeads(leadsData);
    setPinnedIds(pinsData);
    setDataLoading(false);
  }, [authSeller]);

  useEffect(() => { loadData(); }, [loadData]);

  // Save a single lead to API (debounced by caller)
  const saveLead = async (lead: Lead) => {
    await updateLead(lead.id, lead);
  };

  const startAutopilot = () => {
    const q = getAutopilotQueue(leads, seller);
    const queue = [...q.callbacks, ...q.offers, ...q.scored].map(l => ({ ...l, score: scoreLead(l, seller) }));
    if (!queue.length) return;
    setDq(queue);
    setDi(0);
    setDialerOn(true);
    setStats({ calls: 0, offers: 0, orders: 0 });
    const locked = lockLeadLocal(leads, queue[0].id, seller);
    setLeads(locked);
    const lockedLead = locked.find(l => l.id === queue[0].id);
    if (lockedLead) updateLead(lockedLead.id, { lockedBy: lockedLead.lockedBy, lockedAt: lockedLead.lockedAt });
  };

  const stopDialer = () => {
    setDialerOn(false);
    setDq([]);
    setDi(0);
  };

  const handleOutcome = async (type: string, extra?: { date?: string; tb?: number }) => {
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
      lead.history = [...lead.history, { date: today, outcome: 'Ej svar – åter om 2h', note: lead.note || '', seller }];
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
      lead.history = [...lead.history, { date: today, outcome: `✅ Order! TB: ${extra?.tb || 0} kr`, note: lead.note || '', seller }];
      setStats(s => ({ ...s, calls: s.calls + 1, orders: s.orders + 1 }));
    }

    lead.lockedBy = null;
    lead.lockedAt = null;
    lead.note = '';
    updated[idx] = lead;

    // Save to API
    await saveLead(lead);

    const next = di + 1;
    if (next < dq.length) {
      const u = lockLeadLocal(updated, dq[next].id, seller);
      setLeads(u);
      setDi(next);
      const nextLead = u.find(l => l.id === dq[next].id);
      if (nextLead) updateLead(nextLead.id, { lockedBy: nextLead.lockedBy, lockedAt: nextLead.lockedAt });
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
    const locked = lockLeadLocal(leads, id, seller);
    setLeads(locked);
    setView('dialer');
    const lockedLead = locked.find(l => l.id === id);
    if (lockedLead) updateLead(lockedLead.id, { lockedBy: lockedLead.lockedBy, lockedAt: lockedLead.lockedAt });
  };

  const handleUnlock = async (id: number) => {
    const unlocked = unlockLeadLocal(leads, id, seller);
    setLeads(unlocked);
    await updateLead(id, { lockedBy: null, lockedAt: null });
  };

  // Handle field updates from CustomerCard — save to API
  const handleLeadUpdate = (newLeads: Lead[]) => {
    setLeads(newLeads);
    // Find which lead changed and save it
    const cur = dq[di];
    if (cur) {
      const changed = newLeads.find(l => l.id === cur.id);
      if (changed) {
        // Debounce: save after 1 second of no changes
        clearTimeout((window as unknown as Record<string, ReturnType<typeof setTimeout>>).__saveTimer);
        (window as unknown as Record<string, ReturnType<typeof setTimeout>>).__saveTimer = setTimeout(() => saveLead(changed), 1000);
      }
    }
  };

  const togglePin = async (id: number) => {
    if (pinnedIds.includes(id)) {
      setPinnedIds(pinnedIds.filter(p => p !== id));
      await removePin(id);
    } else {
      setPinnedIds([...pinnedIds, id]);
      await addPin(id);
    }
  };

  const convertToLead = async (id: number) => {
    setLeads(leads.map(l => l.id === id ? { ...l, status: 'ny' } : l));
    setPinnedIds(pinnedIds.filter(p => p !== id));
    await updateLead(id, { status: 'ny' });
    await removePin(id);
    setProspektDetailId(null);
  };

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCalls = leads.flatMap(l => l.history || []).filter(e => e.date === todayStr && e.seller === seller).length;
  const todayOrders = leads.flatMap(l => l.history || []).filter(e => e.date === todayStr && e.seller === seller && e.outcome.includes('Order')).length;

  const badges = {
    dialer: getAutopilotQueue(leads, seller).total,
    pipeline: leads.filter(l => l.seller === seller && ['offert', 'apg'].includes(l.status)).length,
    leads: leads.filter(l => !['blacklist', 'prospekt'].includes(l.status)).length,
    prospekt: leads.filter(l => l.status === 'prospekt').length,
  };

  if (authLoading && !authSeller) {
    return (
      <div className="fixed inset-0 bg-[#0c0c14] flex items-center justify-center">
        <div className="text-white text-lg font-bold animate-pulse">&#9889; Säljös</div>
      </div>
    );
  }

  if (!authSeller) return <LoginScreen />;

  const cur = dialerOn && dq[di] ? leads.find(l => l.id === dq[di].id) : null;

  return (
    <div className="flex h-full">
      <Sidebar
        view={view}
        onNavigate={v => { if (dialerOn) stopDialer(); setProspektDetailId(null); setView(v); }}
        badges={badges}
        seller={seller}
        onLogout={logout}
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
            <CustomerCard lead={cur} leads={leads} seller={seller} onUpdate={handleLeadUpdate} onStop={stopDialer} onNext={handleOutcome} />
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
          <PipelineView leads={leads} seller={seller} onOpenLead={openLead} onUnlock={handleUnlock} />
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
          <SettingsView leads={leads} onReloadLeads={loadData} />
        )}
      </main>
    </div>
  );
}
