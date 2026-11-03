"use client";

import React, { useState } from "react";
import { Plus, Target, CheckCircle2, Calendar, Coins, Clock, ArrowRight, ShieldCheck, Trash2 } from "lucide-react";
import { FinancialGoal } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

interface GoalsViewProps {
  goals: FinancialGoal[];
  currency: string;
  onOpenAddGoal: () => void;
  onOpenContributeModal: (goal: FinancialGoal) => void;
  onDeleteGoal: (id: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  currency,
  onOpenAddGoal,
  onOpenContributeModal,
  onDeleteGoal,
}) => {
  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const totalSaved = goals.reduce((acc, g) => acc + g.current_amount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Financial Goals & Savings</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Plan, fund, and track targeted savings for emergencies, milestone purchases, and long-term security.
          </p>
        </div>

        <button
          onClick={onOpenAddGoal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          Create Savings Goal
        </button>
      </div>

      {/* Aggregate Goal Progress Card */}
      <div className="glass-card p-5 rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900 to-slate-950 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" /> Overall Savings Progress
            </span>
            <div className="flex items-baseline gap-3 mt-1.5">
              <span className="text-3xl font-extrabold text-white">
                {formatCurrency(totalSaved, currency)}
              </span>
              <span className="text-sm text-slate-400 font-medium">
                of {formatCurrency(totalTarget, currency)} target
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-slate-400">Completion</span>
              <p className="text-xl font-bold text-cyan-400">{overallProgress.toFixed(1)}%</p>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-cyan-400 border-r-cyan-400 flex items-center justify-center font-bold text-xs text-white">
              {Math.round(overallProgress)}%
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden mt-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 transition-all duration-500"
            style={{ width: `${Math.min(100, overallProgress)}%` }}
          />
        </div>
      </div>

      {/* Individual Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((g) => {
          const isCompleted = g.current_amount >= g.target_amount;
          return (
            <div
              key={g.id}
              className={`glass-card p-5 rounded-2xl border transition relative flex flex-col justify-between ${
                isCompleted ? "border-emerald-500/40 bg-emerald-950/10" : "border-slate-800"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60">
                      {g.category}
                    </span>
                    <h3 className="font-bold text-white text-base mt-2">{g.title}</h3>
                  </div>

                  {isCompleted ? (
                    <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                      {g.progress_percentage}%
                    </span>
                  )}
                </div>

                {/* Amount Progress */}
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xl font-bold text-slate-100">
                    {formatCurrency(g.current_amount, currency)}
                  </span>
                  <span className="text-xs text-slate-400">
                    of {formatCurrency(g.target_amount, currency)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCompleted ? "bg-emerald-500" : "bg-cyan-500"
                    }`}
                    style={{ width: `${Math.min(100, g.progress_percentage)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                  <span>Remaining: {formatCurrency(g.remaining_amount, currency)}</span>
                  {g.deadline && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      Target: {formatDate(g.deadline)}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <button
                  onClick={() => onDeleteGoal(g.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                  title="Delete goal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => onOpenContributeModal(g)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition shadow-sm"
                >
                  <Coins className="w-3.5 h-3.5" />
                  Add Funds
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
