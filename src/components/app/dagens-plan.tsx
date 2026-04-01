"use client";

import { Lead, INDUSTRY_LABELS } from '@/lib/types';
import { getAutopilotQueue, bindLabel, bindColor } from '@/lib/scoring';
import { cn, fmtPhone, getGreeting } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Flame, TrendingUp, Target, Phone } from 'lucide-react';

interface DagensPlanProps {
  leads: Lead[];
  seller: string;
  onStart: () => void;
}

export function DagensPlan({ leads, seller, onStart }: DagensPlanProps) {
  const q = getAutopilotQueue(leads, seller);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCalls = leads.flatMap(l => l.history || []).filter(e => e.date === todayStr && e.seller === seller).length;
  const todayOrders = leads.flatMap(l => l.history || []).filter(e => e.date === todayStr && e.seller === seller && e.outcome.includes('Order')).length;
  const orders = leads.filter(l => l.status === 'order' && l.seller === seller);
  const totalTB = orders.reduce((s, l) => s + (l.tb_amount || 0), 0);

  // Streak: consecutive days with at least 1 call
  const dates = [...new Set(leads.flatMap(l => l.history || []).filter(e => e.seller === seller).map(e => e.date))].sort().reverse();
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 60; i++) {
    const ds = d.toISOString().slice(0, 10);
    if (dates.includes(ds)) { streak++; d.setDate(d.getDate() - 1); } else if (i === 0) { d.setDate(d.getDate() - 1); } else break;
  }

  const dailyGoal = 30;
  const goalPct = Math.min((todayCalls / dailyGoal) * 100, 100);

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0c0c14] via-[#151530] to-[#1e1450] rounded-2xl p-10 relative overflow-hidden mb-6">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(91,95,199,.12),transparent_70%)] rounded-full" />
        <div className="absolute bottom-[-30%] left-[-5%] w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(34,197,94,.06),transparent_70%)] rounded-full" />
        <div className="relative z-10">
          <p className="text-sm text-white/50 mb-1">{getGreeting()}</p>
          <h1 className="text-3xl font-extrabold text-white tracking-tight mb-2">
            {seller.charAt(0).toUpperCase() + seller.slice(1)} &#128075;
          </h1>

          {/* Motivational stats row */}
          <div className="flex gap-3 items-center mb-8 mt-4">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/25 rounded-full px-3 py-1.5">
                <Flame size={14} className="text-amber-400" />
                <span className="text-xs font-bold text-amber-300">{streak} dagars streak</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 bg-green-500/15 border border-green-500/25 rounded-full px-3 py-1.5">
              <TrendingUp size={14} className="text-green-400" />
              <span className="text-xs font-bold text-green-300">{totalTB.toLocaleString('sv-SE')} kr TB</span>
            </div>
            {todayOrders > 0 && (
              <div className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/30 rounded-full px-3 py-1.5">
                <span className="text-xs font-bold text-green-300">&#127942; {todayOrders} ordrar idag!</span>
              </div>
            )}
          </div>

          {/* Daily progress bar */}
          <div className="mb-8 max-w-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-white/50 font-medium">Dagens samtal</span>
              <span className="text-xs font-bold text-white/80">{todayCalls} / {dailyGoal}</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  goalPct >= 100 ? "bg-gradient-to-r from-green-400 to-emerald-300" :
                  goalPct >= 60 ? "bg-gradient-to-r from-blue-400 to-blue-300" :
                  "bg-gradient-to-r from-orange-400 to-amber-300"
                )}
                style={{ width: `${goalPct}%` }}
              />
            </div>
            {goalPct >= 100 && <p className="text-xs text-green-300 font-semibold mt-1">&#127881; Dagligt mål uppnått!</p>}
          </div>

          {/* Queue cards */}
          <div className="flex gap-4 flex-wrap mb-8">
            <Card className="bg-orange-500/15 border-orange-500/30 min-w-[150px] hover:border-orange-400/50 transition-colors">
              <CardContent className="p-4">
                <div className="text-3xl font-extrabold text-orange-400">{q.callbacks.length}</div>
                <div className="text-xs text-white/60 mt-1">Återkomster</div>
                <div className="text-[10px] text-orange-300/60 mt-0.5">Ring först</div>
              </CardContent>
            </Card>
            <Card className="bg-amber-500/15 border-amber-500/30 min-w-[150px] hover:border-amber-400/50 transition-colors">
              <CardContent className="p-4">
                <div className="text-3xl font-extrabold text-amber-400">{q.offers.length}</div>
                <div className="text-xs text-white/60 mt-1">Offerter</div>
                <div className="text-[10px] text-amber-300/60 mt-0.5">Följ upp = pengar</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-500/15 border-blue-500/30 min-w-[150px] hover:border-blue-400/50 transition-colors">
              <CardContent className="p-4">
                <div className="text-3xl font-extrabold text-blue-400">{q.scored.length}</div>
                <div className="text-xs text-white/60 mt-1">Leads redo</div>
                <div className="text-[10px] text-blue-300/60 mt-0.5">Sorterade efter potential</div>
              </CardContent>
            </Card>
          </div>

          {/* CTA */}
          <Button
            onClick={onStart}
            size="lg"
            className="bg-gradient-to-r from-green-500 to-emerald-400 hover:from-green-400 hover:to-emerald-300 text-white font-bold text-base px-14 h-14 rounded-xl shadow-lg shadow-green-500/30 transition-all hover:shadow-green-400/40 hover:scale-[1.02]"
          >
            <Phone size={18} className="mr-2" />
            BÖRJA RINGA ({q.total} leads)
          </Button>
        </div>
      </div>

      {/* Upcoming callbacks */}
      {q.callbacks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 rounded bg-orange-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Först ut — återkomster
            </h3>
            <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/25 text-[10px]">
              {q.callbacks.length} st
            </Badge>
          </div>
          <div className="space-y-2">
            {q.callbacks.slice(0, 5).map(l => (
              <Card key={l.id} className="hover:shadow-md hover:border-orange-200 transition-all">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
                      <Target size={14} className="text-orange-500" />
                    </div>
                    <div>
                      <div className="font-bold text-sm">{l.company}</div>
                      <div className="text-xs text-muted-foreground">
                        {fmtPhone(l.phone)} &middot; {INDUSTRY_LABELS[l.industry] || l.industry}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{l.operator}</Badge>
                    <span className={cn("text-xs", bindColor(l.bindingDate))}>{bindLabel(l.bindingDate)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
