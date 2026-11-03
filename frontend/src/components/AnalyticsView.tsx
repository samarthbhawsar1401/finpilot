"use client";

import React from "react";
import {
  TrendingUp,
  Download,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  HelpCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";
import { CashFlowForecast, DashboardSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/lib/api";

interface AnalyticsViewProps {
  forecast: CashFlowForecast | null;
  summary: DashboardSummary | null;
  currency: string;
  onOpenAiPrompt: (prompt: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  forecast,
  summary,
  currency,
  onOpenAiPrompt,
}) => {
  if (!forecast) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleExportCsv = () => {
    window.open(api.getExportCsvUrl(), "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Cash-Flow Forecasting & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Predictive financial modeling powered by rolling multi-cycle baseline algorithms.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 border border-slate-700/80 font-semibold text-xs transition"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          Download Financial Ledger Report
        </button>
      </div>

      {/* Baseline Rolling Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Rolling Baseline Income</span>
          <div className="text-2xl font-bold text-white mt-1">
            {formatCurrency(forecast.avg_monthly_income, currency)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Based on {forecast.historical_months_analyzed} historical months
          </span>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Rolling Baseline Burn Rate</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            {formatCurrency(forecast.avg_monthly_expenses, currency)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Average monthly outflows</span>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">Projected Monthly Savings</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {formatCurrency(forecast.estimated_monthly_savings, currency)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Estimated net monthly delta</span>
        </div>

        <div className="glass-card p-4 rounded-2xl">
          <span className="text-xs text-slate-400 font-medium">3-Month Cumulative Surplus</span>
          <div className="text-2xl font-bold text-cyan-400 mt-1">
            {formatCurrency(forecast.three_month_savings_estimate, currency)}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            6-mo: {formatCurrency(forecast.six_month_savings_estimate, currency)}
          </span>
        </div>
      </div>

      {/* Predictive Cash-Flow Chart */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Cash-Flow Trajectory (Historical vs. 3-Month Projection)
            </h2>
            <p className="text-xs text-slate-400">
              Solid bars represent past verified ledgers; shaded zone projects expected liquidity.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Income
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Expenses
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" /> Net Savings
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={forecast.forecast_chart_data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
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
                formatter={(val: any) => [formatCurrency(Number(val), currency), ""]}
              />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} opacity={0.85} />
              <Line
                type="monotone"
                dataKey="net_savings"
                name="Net Savings"
                stroke="#06b6d4"
                strokeWidth={3}
                dot={{ r: 4, fill: "#06b6d4" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations & Guidance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="glass-card p-5 rounded-2xl">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            AI Forecast Analysis & Recommendations
          </h3>
          <div className="space-y-2.5">
            {forecast.recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>{rec}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm mb-2">Simulate Cash Flow Adjustments</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Ask FinPilot AI to simulate custom economic scenarios, e.g. "What if my rent increases by 15%?" or "Can I afford a ₹50,000 expense next month?".
            </p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => onOpenAiPrompt("Simulate my cash flow if I reduce dining expenses by 30% next month")}
              className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-cyan-300 transition flex items-center justify-between"
            >
              <span>"Simulate cutting dining expenses by 30%"</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onOpenAiPrompt("Can I afford to save ₹15,000 every month for the next quarter?")}
              className="w-full text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 text-xs text-cyan-300 transition flex items-center justify-between"
            >
              <span>"Can I afford to save ₹15,000/mo next quarter?"</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
