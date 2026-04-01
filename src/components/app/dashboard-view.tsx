"use client";

import { Lead, TARGET_INDUSTRIES } from '@/lib/types';
import { scoreLead } from '@/lib/scoring';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Phone, ShoppingCart, FileText, Clock, Star, Flame } from 'lucide-react';

interface DashboardViewProps {
  leads: Lead[];
  seller: string;
}

export function DashboardView({ leads, seller }: DashboardViewProps) {
  const orders = leads.filter(l => l.status === 'order' && l.seller === seller);
  const totalTB = orders.reduce((s, l) => s + (l.tb_amount || 0), 0);
  const tbGoal = 50000;
  const tbPct = Math.min((totalTB / tbGoal) * 100, 100);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCalls = leads.flatMap(l => l.history || []).filter(e => e.date === todayStr && e.seller === seller).length;
  const todayOffers = leads.flatMap(l => l.history || []).filter(e => e.date === todayStr && e.seller === seller && e.outcome.includes('Offert')).length;
  const todayOrders = leads.flatMap(l => l.history || []).filter(e => e.date === todayStr && e.seller === seller && e.outcome.includes('Order')).length;

  // Weekly calls
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekCalls = leads.flatMap(l => l.history || []).filter(e => e.seller === seller && new Date(e.date) >= weekAgo).length;

  // Conversion rate
  const totalCalls = leads.flatMap(l => l.history || []).filter(e => e.seller === seller).length;
  const convRate = totalCalls > 0 ? Math.round((orders.length / totalCalls) * 100) : 0;

  const kpis = [
    {
      l: 'TB Denna Månad',
      v: `${totalTB.toLocaleString('sv-SE')} kr`,
      icon: <TrendingUp size={20} />,
      c: 'border-l-green-500',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-400',
      s: tbPct >= 100 ? '&#127942; Mål uppnått!' : `${Math.round(tbPct)}% av ${(tbGoal / 1000)}k`,
      bar: tbPct,
      barColor: tbPct >= 100 ? 'from-green-400 to-emerald-300' : tbPct >= 60 ? 'from-green-500 to-green-400' : 'from-orange-400 to-amber-300',
    },
    {
      l: 'Samtal Idag',
      v: todayCalls,
      icon: <Phone size={20} />,
      c: 'border-l-blue-500',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      s: `${weekCalls} denna vecka`,
    },
    {
      l: 'Ordrar',
      v: orders.length,
      icon: <ShoppingCart size={20} />,
      c: 'border-l-green-400',
      iconBg: 'bg-green-400/20',
      iconColor: 'text-green-300',
      s: `${orders.filter(l => l.deal_type === 'nyteck').length} nyteck, ${orders.filter(l => l.deal_type === 'forlang').length} förläng`,
    },
    {
      l: 'Offerter Ute',
      v: leads.filter(l => l.status === 'offert' && l.seller === seller).length,
      icon: <FileText size={20} />,
      c: 'border-l-orange-400',
      iconBg: 'bg-orange-400/20',
      iconColor: 'text-orange-300',
      s: 'Följ upp = pengar',
    },
    {
      l: 'Återkomster',
      v: leads.filter(l => l.nextCallDate && new Date(l.nextCallDate) <= new Date() && l.seller === seller).length,
      icon: <Clock size={20} />,
      c: 'border-l-amber-400',
      iconBg: 'bg-amber-400/20',
      iconColor: 'text-amber-300',
      s: 'Väntar på dig',
    },
    {
      l: 'Konvertering',
      v: `${convRate}%`,
      icon: <Star size={20} />,
      c: 'border-l-violet-400',
      iconBg: 'bg-violet-400/20',
      iconColor: 'text-violet-300',
      s: `${orders.length} ordrar av ${totalCalls} samtal`,
    },
  ];

  return (
    <div className="bg-gradient-to-b from-[#0a0f1c] to-[#050810] min-h-screen rounded-2xl p-8 text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 pb-5 border-b border-blue-500/20">
        <div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
            DASHBOARD
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {new Date().toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Today's quick stats */}
        <div className="flex gap-3">
          {todayCalls > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-extrabold text-blue-400">{todayCalls}</div>
              <div className="text-[10px] text-blue-300/60">samtal idag</div>
            </div>
          )}
          {todayOffers > 0 && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-extrabold text-orange-400">{todayOffers}</div>
              <div className="text-[10px] text-orange-300/60">offerter idag</div>
            </div>
          )}
          {todayOrders > 0 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2 text-center">
              <div className="text-lg font-extrabold text-green-400">{todayOrders}</div>
              <div className="text-[10px] text-green-300/60">ordrar idag</div>
            </div>
          )}
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map(k => (
          <Card key={k.l} className={cn("bg-gradient-to-br from-[#111827] to-[#0b1220] border-[rgba(59,130,246,.15)] border-l-4 hover:border-[rgba(59,130,246,.3)] transition-colors", k.c)}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{k.l}</div>
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", k.iconBg)}>
                  <span className={k.iconColor}>{k.icon}</span>
                </div>
              </div>
              <div className="text-4xl font-extrabold text-white mb-1">{k.v}</div>
              <div className="text-sm text-slate-500" dangerouslySetInnerHTML={{ __html: k.s }} />
              {k.bar !== undefined && (
                <div className="mt-4 h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-700", `bg-gradient-to-r ${k.barColor}`)}
                    style={{ width: `${k.bar}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prio leads section */}
      {leads.filter(l => TARGET_INDUSTRIES.includes(l.industry) && scoreLead(l, seller) > 0).length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <Flame size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Högst potential just nu</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {leads
              .filter(l => TARGET_INDUSTRIES.includes(l.industry) && scoreLead(l, seller) > 0)
              .sort((a, b) => scoreLead(b, seller) - scoreLead(a, seller))
              .slice(0, 3)
              .map(l => (
                <Card key={l.id} className="bg-gradient-to-br from-[#111827] to-[#0b1220] border-amber-500/20 hover:border-amber-400/40 transition-colors">
                  <CardContent className="p-4">
                    <div className="font-bold text-sm text-white">{l.company}</div>
                    <div className="text-xs text-slate-500 mt-1">{l.operator} &middot; Poang: {scoreLead(l, seller)}</div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
