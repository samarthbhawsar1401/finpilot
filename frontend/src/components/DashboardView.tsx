"use client";

import React from "react";
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Plus,
  ArrowRight
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from "recharts";
import { DashboardSummary } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardViewProps {
  summary: DashboardSummary | null;
  currency: string;
  onOpenAddTx: () => void;
  onNavigateTab: (tab: any) => void;
  onOpenAiPrompt: (prompt: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  currency,
  onOpenAddTx,
  onNavigateTab,
  onOpenAiPrompt,
}) => {
  if (!summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading FinPilot intelligence dashboard...</p>
        </div>
      </div>
    );
  }

  const COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#ec4899", "#8b5cf6", "#ef4444", "#3b82f6"];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Financial Intelligence Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-account analytics, predictive cash flows, and AI behavioral insights.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAddTx}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Net Worth</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(summary.total_balance, currency)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-semibold">Active</span> across accounts & funds
          </div>
        </div>

        {/* Monthly Income */}
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monthly Income</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(summary.total_income_this_month, currency)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className={summary.income_change_pct >= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
              {summary.income_change_pct >= 0 ? `+${summary.income_change_pct}%` : `${summary.income_change_pct}%`}
            </span>
            <span className="text-slate-400">vs last month</span>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monthly Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(summary.total_expenses_this_month, currency)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className={summary.expense_change_pct <= 0 ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
              {summary.expense_change_pct >= 0 ? `+${summary.expense_change_pct}%` : `${summary.expense_change_pct}%`}
            </span>
            <span className="text-slate-400">vs last month</span>
          </div>
        </div>

        {/* Net Monthly Savings */}
        <div className="glass-card p-4 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Net Monthly Savings</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(summary.net_savings_this_month, currency)}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
              {summary.savings_rate_this_month}% Savings Rate
            </span>
          </div>
        </div>
      </div>

      {/* AI Quick Insights Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-cyan-950/30 to-slate-900 border border-emerald-500/20 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              FinPilot Intelligence · Automated Spending Signals
            </span>
          </div>
          <button
            onClick={() => onOpenAiPrompt("Generate a detailed summary of my spending behaviour this month")}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 transition"
          >
            Deep Dive with AI <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {summary.quick_ai_insights.map((insight, idx) => (
            <div
              key={idx}
              onClick={() => onOpenAiPrompt(`Tell me more about: "${insight}"`)}
              className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer transition text-xs text-slate-200 flex items-start gap-2.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span className="leading-relaxed">{insight}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Section: Income vs Expense & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense History */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Income vs Expenses (Last 6 Months)
              </h2>
              <p className="text-xs text-slate-400">Visual cash-flow comparison across billing cycles</p>
            </div>
            <button
              onClick={() => onNavigateTab("analytics")}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition font-medium"
            >
              View Forecast <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthly_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                <XAxis dataKey="month_label" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `${currency === "INR" ? "₹" : "$"}${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.75rem",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [formatCurrency(Number(value), currency), ""]}
                />
                <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Donut */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-bold text-white">Expense Distribution</h2>
              <p className="text-xs text-slate-400">Current month category share</p>
            </div>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            {summary.category_breakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.category_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="amount"
                  >
                    {summary.category_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value), currency), ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No expenses recorded this month.</p>
            )}
          </div>

          {/* Category List */}
          <div className="space-y-2 mt-2 max-h-36 overflow-y-auto pr-1">
            {summary.category_breakdown.slice(0, 4).map((cat, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="text-slate-300 truncate max-w-[110px]">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-slate-200">{formatCurrency(cat.amount, currency)}</span>
                  <span className="text-slate-500 text-[10px] w-8 text-right">{cat.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget Utilization Progress & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Budgets Watchlist */}
        <div className="glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Monthly Budgets</h2>
              <p className="text-xs text-slate-400">Live limits & 80% threshold warnings</p>
            </div>
            <button
              onClick={() => onNavigateTab("budgets")}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition font-medium"
            >
              All Budgets <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5">
            {summary.budget_statuses.slice(0, 4).map((b) => (
              <div key={b.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span className="text-slate-200">{b.category_name}</span>
                  <span
                    className={
                      b.is_exceeded
                        ? "text-rose-400 font-bold"
                        : b.is_warning
                        ? "text-amber-400 font-bold"
                        : "text-emerald-400 font-bold"
                    }
                  >
                    {b.utilization_percentage}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      b.is_exceeded
                        ? "bg-rose-500"
                        : b.is_warning
                        ? "bg-amber-400"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, b.utilization_percentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>Spent: {formatCurrency(b.spent_amount, currency)}</span>
                  <span>Cap: {formatCurrency(b.budgeted_amount, currency)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 glass-card p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Recent Transactions</h2>
              <p className="text-xs text-slate-400">Latest recorded income & expenses</p>
            </div>
            <button
              onClick={() => onNavigateTab("transactions")}
              className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition font-medium"
            >
              Manage Transactions <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider text-[10px]">
                  <th className="pb-2.5 font-semibold">Description</th>
                  <th className="pb-2.5 font-semibold">Category</th>
                  <th className="pb-2.5 font-semibold">Date</th>
                  <th className="pb-2.5 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {summary.recent_transactions.slice(0, 6).map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/40 transition">
                    <td className="py-2.5 font-medium text-slate-200">{tx.description}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] border border-slate-700/60">
                        {tx.category?.name || "General"}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400">{formatDate(tx.date)}</td>
                    <td
                      className={`py-2.5 text-right font-bold ${
                        tx.type === "income" ? "text-emerald-400" : "text-slate-100"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
