"use client";

import React from "react";
import { Plus, AlertTriangle, CheckCircle, PieChart, Sparkles, TrendingDown, ArrowRight, ShieldAlert } from "lucide-react";
import { BudgetStatus, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface BudgetsViewProps {
  budgets: BudgetStatus[];
  categories: Category[];
  currency: string;
  onOpenAddBudget: () => void;
  onDeleteBudget: (id: string) => void;
  onOpenAiPrompt: (prompt: string) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  categories,
  currency,
  onOpenAddBudget,
  onDeleteBudget,
  onOpenAiPrompt,
}) => {
  const totalBudgeted = budgets.reduce((acc, b) => acc + b.budgeted_amount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent_amount, 0);
  const totalRemaining = Math.max(0, totalBudgeted - totalSpent);
  const overallUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

  const warningBudgets = budgets.filter((b) => b.is_warning);
  const exceededBudgets = budgets.filter((b) => b.is_exceeded);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Budget Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Set category limits, monitor real-time utilization, and prevent month-end overspending.
          </p>
        </div>

        <button
          onClick={onOpenAddBudget}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Category Budget
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Total Budget Cap</span>
          <div className="text-2xl font-bold text-white mt-1">
            {formatCurrency(totalBudgeted, currency)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Allocated this month</span>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Total Spent in Budgets</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            {formatCurrency(totalSpent, currency)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {overallUtilization.toFixed(1)}% of total cap
          </span>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Remaining Discretionary</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {formatCurrency(totalRemaining, currency)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Safe to spend</span>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Threshold Alerts</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {warningBudgets.length + exceededBudgets.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {exceededBudgets.length} exceeded · {warningBudgets.length} warning (&gt;80%)
          </span>
        </div>
      </div>

      {/* Threshold Warning Alert Banner if any */}
      {(exceededBudgets.length > 0 || warningBudgets.length > 0) && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex items-start justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300">
                Budget Alert: {exceededBudgets.length} categories exceeded · {warningBudgets.length} categories near 80% limit
              </p>
              <p className="text-amber-200/80 mt-0.5">
                FinPilot recommends pausing discretionary transactions in{" "}
                {exceededBudgets.map((b) => b.category_name).join(", ") ||
                  warningBudgets.map((b) => b.category_name).join(", ")}{" "}
                until next billing period.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenAiPrompt("Suggest practical budgeting improvements and ways to optimize my category limits")}
            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-semibold shrink-0 transition"
          >
            Ask AI Optimization
          </button>
        </div>
      )}

      {/* Grid of Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((b) => (
          <div
            key={b.id}
            className={`glass-card p-5 rounded-2xl border transition relative ${
              b.is_exceeded
                ? "border-rose-500/40 bg-rose-950/10"
                : b.is_warning
                ? "border-amber-500/40 bg-amber-950/10"
                : "border-slate-800"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs"
                  style={{
                    backgroundColor: `${b.category_color}20`,
                    color: b.category_color,
                    border: `1px solid ${b.category_color}40`,
                  }}
                >
                  {b.category_name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm leading-none">{b.category_name}</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Monthly cycle</p>
                </div>
              </div>

              {b.is_exceeded ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  Exceeded
                </span>
              ) : b.is_warning ? (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  80% Warning
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  Healthy
                </span>
              )}
            </div>

            {/* Spent vs Budget amount */}
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-bold text-white">
                {formatCurrency(b.spent_amount, currency)}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                of {formatCurrency(b.budgeted_amount, currency)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden mb-2">
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

            {/* Footer metrics */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60 mt-3">
              <span>{b.utilization_percentage}% utilized</span>
              <span className={b.is_exceeded ? "text-rose-400 font-medium" : "text-slate-300"}>
                {b.is_exceeded
                  ? `Over by ${formatCurrency(b.spent_amount - b.budgeted_amount, currency)}`
                  : `${formatCurrency(b.remaining_amount, currency)} left`}
              </span>
            </div>

            {/* Delete button */}
            <button
              onClick={() => onDeleteBudget(b.id)}
              className="mt-3 text-[11px] text-slate-500 hover:text-rose-400 transition flex items-center gap-1"
            >
              Remove budget
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
