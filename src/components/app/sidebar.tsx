"use client";

import { ViewName } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Zap, GitBranch, Users, Building2, BarChart3, Search, Settings, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const NAV_ITEMS: { view: ViewName; icon: React.ReactNode; label: string; badgeKey?: string; badgeColor?: string }[] = [
  { view: 'dialer', icon: <Zap size={18} />, label: 'Dialer', badgeKey: 'dialer', badgeColor: 'bg-green-500' },
  { view: 'pipeline', icon: <GitBranch size={18} />, label: 'Pipeline', badgeKey: 'pipeline', badgeColor: 'bg-orange-500' },
  { view: 'leads', icon: <Users size={18} />, label: 'Leads', badgeKey: 'leads', badgeColor: 'bg-blue-500' },
  { view: 'prospekt', icon: <Building2 size={18} />, label: 'Prospekt', badgeKey: 'prospekt', badgeColor: 'bg-slate-500' },
  { view: 'dash', icon: <BarChart3 size={18} />, label: 'Dashboard' },
  { view: 'sok', icon: <Search size={18} />, label: 'Sök' },
];

interface SidebarProps {
  view: ViewName;
  onNavigate: (v: ViewName) => void;
  badges: Record<string, number>;
  seller: string;
  onLogout: () => void;
  todayCalls?: number;
  todayOrders?: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ view, onNavigate, badges, seller, onLogout, todayCalls = 0, todayOrders = 0, collapsed, onToggleCollapse }: SidebarProps) {
  const displayName = seller.charAt(0).toUpperCase() + seller.slice(1);
  const dailyGoal = 30;
  const goalPct = Math.min((todayCalls / dailyGoal) * 100, 100);
  const w = collapsed ? 'w-[60px]' : 'w-[240px]';

  return (
    <aside className={cn("fixed left-0 top-0 bottom-0 bg-[#0c0c14] text-white flex flex-col z-50 transition-all duration-200", w)}>
      {/* Logo + collapse toggle */}
      <div className={cn("flex items-center pt-4 pb-2", collapsed ? "justify-center px-2" : "justify-between px-4")}>
        <div className="flex items-center gap-2">
          <span className="text-lg">&#9889;</span>
          {!collapsed && (
            <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-[#a5a8f8] to-[#7c7ff2] bg-clip-text text-transparent">
              Säljös
            </span>
          )}
        </div>
        {!collapsed && (
          <button onClick={onToggleCollapse} className="text-[#555] hover:text-[#999] transition-colors p-1">
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button onClick={onToggleCollapse} className="mx-auto my-1 text-[#555] hover:text-[#999] transition-colors p-1">
          <PanelLeftOpen size={16} />
        </button>
      )}

      {/* User card */}
      {!collapsed ? (
        <div className="mx-3 mb-2 bg-gradient-to-r from-[rgba(91,95,199,.15)] to-[rgba(124,127,242,.08)] border border-[rgba(91,95,199,.2)] rounded-lg p-2 flex items-center gap-2">
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="bg-gradient-to-r from-[#5b5fc7] to-[#7c7ff2] text-xs font-bold">
              {displayName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-xs font-bold truncate">{displayName}</div>
            <div className="text-[10px] text-[#666]">Sales rep</div>
          </div>
        </div>
      ) : (
        <div className="mx-auto mb-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-r from-[#5b5fc7] to-[#7c7ff2] text-xs font-bold">
              {displayName[0]}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Daily progress mini-bar */}
      {!collapsed && (
        <div className="mx-3 mb-2 px-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] text-[#555]">Idag: {todayCalls} samtal</span>
            {todayOrders > 0 && <span className="text-[9px] text-green-400 font-bold">{todayOrders} ordrar!</span>}
          </div>
          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                goalPct >= 100 ? "bg-green-400" : goalPct >= 60 ? "bg-blue-400" : "bg-orange-400"
              )}
              style={{ width: `${goalPct}%` }}
            />
          </div>
        </div>
      )}

      {!collapsed && <div className="px-3 pt-2 pb-1 text-[9px] uppercase tracking-[2px] text-[#2a2a3a] font-bold">Meny</div>}

      <nav className="flex-1 mt-1">
        {NAV_ITEMS.map(item => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            title={collapsed ? item.label : undefined}
            className={cn(
              "w-full flex items-center transition-all",
              collapsed
                ? "justify-center py-2.5 mx-auto"
                : "gap-2.5 px-4 py-2 text-[13px] font-medium border-l-[3px] border-transparent mr-1 rounded-r-lg",
              view === item.view
                ? collapsed
                  ? "text-white bg-[rgba(91,95,199,.2)] rounded-lg mx-1"
                  : "border-l-[#7c7ff2] bg-gradient-to-r from-[rgba(91,95,199,.15)] to-[rgba(124,127,242,.08)] text-white font-semibold"
                : "text-[#777] hover:bg-white/[.06] hover:text-[#ccc]"
            )}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
            {!collapsed && item.badgeKey && badges[item.badgeKey] > 0 && (
              <Badge className={cn("ml-auto text-[9px] px-1.5 py-0 text-white", item.badgeColor || 'bg-[#5b5fc7]')}>
                {badges[item.badgeKey]}
              </Badge>
            )}
            {collapsed && item.badgeKey && badges[item.badgeKey] > 0 && (
              <span className={cn("absolute top-0 right-1 w-2 h-2 rounded-full", item.badgeColor || 'bg-[#5b5fc7]')} />
            )}
          </button>
        ))}
      </nav>

      <div className="border-t border-[#111827] p-2 space-y-0.5">
        <button
          onClick={() => onNavigate('settings')}
          title={collapsed ? 'Inställningar' : undefined}
          className={cn("w-full flex items-center gap-2.5 py-2 text-[13px] text-[#777] hover:text-[#ccc]", collapsed ? "justify-center" : "px-4")}
        >
          <Settings size={16} />
          {!collapsed && <span>Inställningar</span>}
        </button>
        <button
          onClick={onLogout}
          title={collapsed ? 'Logga ut' : undefined}
          className={cn("w-full flex items-center gap-2.5 py-2 text-[13px] text-red-400 hover:text-red-300", collapsed ? "justify-center" : "px-4")}
        >
          <LogOut size={16} />
          {!collapsed && <span>Logga ut</span>}
        </button>
      </div>
    </aside>
  );
}
