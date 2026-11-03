"use client";

import React from "react";
import { HeartPulse, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, HelpCircle, Sparkles } from "lucide-react";
import { FinancialHealthScore } from "@/lib/types";

interface HealthScoreViewProps {
  healthScore: FinancialHealthScore | null;
  currency: string;
  onOpenAiPrompt: (prompt: string) => void;
}

export const HealthScoreView: React.FC<HealthScoreViewProps> = ({
  healthScore,
  currency,
  onOpenAiPrompt,
}) => {
  if (!healthScore) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-cyan-400";
    if (score >= 40) return "text-amber-400";
    return "text-rose-400";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "excellent":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Excellent</span>;
      case "good":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Good</span>;
      case "fair":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Fair</span>;
      case "needs_attention":
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">Action Needed</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">Data Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Financial Health Score & Diagnostic
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          An explainable, multi-factor benchmark scoring model based on real, verifiable financial behavior.
        </p>
      </div>

      {/* Hero Score Showcase */}
      <div className="glass-card p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {/* Circular Score Gauge */}
          <div className="relative w-32 h-32 rounded-full border-4 border-slate-800 flex items-center justify-center shrink-0">
            <div className="text-center">
              <span className={`text-4xl font-black tracking-tight ${getScoreColor(healthScore.overall_score)}`}>
                {healthScore.overall_score}
              </span>
              <span className="text-slate-500 text-xs block font-bold">/ 100</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-lg font-bold text-white tracking-tight">
                Rating: {healthScore.rating}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Explainable Model
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xl mt-1.5">
              {healthScore.summary}
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenAiPrompt("How can I lift my financial health score above 90?")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          Ask AI Improvement Strategy
        </button>
      </div>

      {/* The 5 Explainable Indicators Breakdown */}
      <div>
        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          The 5 Weighted Pillars of Financial Health
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {healthScore.indicators.map((ind, i) => (
            <div
              key={i}
              className="glass-card p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-100 text-sm">{ind.name}</h3>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                    {ind.weight}% weight
                  </span>
                </div>
                {getStatusBadge(ind.status)}
              </div>

              {/* Score bar */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span className="text-slate-300 font-medium">{ind.actual_value}</span>
                <span className="font-bold text-slate-200">{ind.score.toFixed(0)} / 100</span>
              </div>

              <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mb-2.5">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, ind.score)}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">{ind.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actionable Tips */}
      <div className="glass-card p-5 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" /> Actionable Prescriptions to Boost Your Score
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {healthScore.actionable_tips.map((tip, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
