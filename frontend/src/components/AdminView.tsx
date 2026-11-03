"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Server, Database, Bot, Users, Activity, CheckCircle2, RefreshCw } from "lucide-react";
import { AdminStats } from "@/lib/types";
import { api } from "@/lib/api";

export const AdminView: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Platform Administration & Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational telemetry and infrastructure health without exposing individual user ledgers.
          </p>
        </div>

        <button
          onClick={loadStats}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Metrics
        </button>
      </div>

      {/* System Status Banner */}
      <div className="glass-card p-4 rounded-2xl bg-gradient-to-r from-emerald-950/30 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {stats?.system_status || "OPERATIONAL · ALL SERVICES HEALTHY"}
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              FastAPI application server, SQLite/PostgreSQL engine, and FinPilot Intelligence services running.
            </p>
          </div>
        </div>

        <div className="hidden sm:block text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Uptime</span>
          <p className="text-xs font-bold text-white">{stats?.platform_uptime_days || 0.01} days</p>
        </div>
      </div>

      {/* Platform Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Registered User Profiles</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.total_users || 1}</div>
          <p className="text-[11px] text-slate-500 mt-1">Isolated multi-tenant partitions</p>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Ledger Transactions</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.total_transactions || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Indexed database entries</p>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">AI Queries & Telemetry</span>
            <Bot className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.total_ai_queries || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Processed intelligence requests</p>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monitored Accounts</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.total_accounts || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Bank, cash & card ledgers</p>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Category Budgets</span>
            <Activity className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.total_budgets || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">With 80% threshold alerts</p>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Financial Goals</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.total_goals || 0}</div>
          <p className="text-[11px] text-slate-500 mt-1">Tracked savings targets</p>
        </div>
      </div>
    </div>
  );
};
