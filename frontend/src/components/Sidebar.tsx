"use client";

import React from "react";
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  Target,
  TrendingUp,
  HeartPulse,
  Bot,
  ShieldCheck,
  ChevronRight,
  Wallet,
  LucideIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export type NavTab =
  | "dashboard"
  | "transactions"
  | "budgets"
  | "goals"
  | "analytics"
  | "health"
  | "ai"
  | "admin";

interface NavItem {
  id: NavTab;
  label: string;
  icon: LucideIcon;
  isAi?: boolean;
  badge?: string;
}

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  totalBalance: number;
  savingsRate: number;
  currency: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  totalBalance,
  savingsRate,
  currency,
}) => {
  const navItems: NavItem[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "transactions", label: "Transactions", icon: Receipt },
    { id: "budgets", label: "Budgets & Limits", icon: PieChart },
    { id: "goals", label: "Financial Goals", icon: Target },
    { id: "analytics", label: "Cash-Flow & Forecast", icon: TrendingUp },
    { id: "health", label: "Health Score", icon: HeartPulse, badge: "New" },
    { id: "ai", label: "FinPilot Intelligence", icon: Bot, isAi: true },
    { id: "admin", label: "Platform Monitoring", icon: ShieldCheck },
  ];

  return (
    <aside className="w-64 border-r border-slate-800/80 bg-[#090d16]/90 flex flex-col justify-between p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      {/* Navigation List */}
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-3 mb-2">
          Finance Core
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-slate-800/90 text-emerald-400 border border-slate-700/60 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-850/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition ${
                    isActive
                      ? item.isAi
                        ? "text-cyan-400"
                        : "text-emerald-400"
                      : "text-slate-400"
                  }`}
                />
                <span className={isActive ? "text-white font-semibold" : ""}>{item.label}</span>
              </div>

              {item.isAi ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  AI
                </span>
              ) : item.badge ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {item.badge}
                </span>
              ) : isActive ? (
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400/60" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Bottom Financial Glance Card */}
      <div className="pt-4 border-t border-slate-800/70">
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800/80 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span className="flex items-center gap-1.5 font-medium">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" /> Total Balance
            </span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              {savingsRate}% saved
            </span>
          </div>
          <p className="text-lg font-bold text-white tracking-tight">
            {formatCurrency(totalBalance, currency)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Aggregated across 4 live accounts
          </p>
        </div>
      </div>
    </aside>
  );
};
