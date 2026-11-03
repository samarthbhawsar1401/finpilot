"use client";

import React from "react";
import { Sparkles, Bot, Shield, IndianRupee, DollarSign, Euro, RefreshCw, UserCheck } from "lucide-react";
import { User } from "@/lib/types";

interface NavbarProps {
  user: User | null;
  onOpenAi: () => void;
  onRefresh: () => void;
  currency: string;
  onCurrencyChange: (c: string) => void;
  isAiDrawerOpen: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAi,
  onRefresh,
  currency,
  onCurrencyChange,
  isAiDrawerOpen,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-md px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-lg text-white">FinPilot</span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI Intelligence
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">Your money. Your intelligence. Your control.</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Currency Switcher */}
        <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
          {(["INR", "USD", "EUR"] as const).map((curr) => (
            <button
              key={curr}
              onClick={() => onCurrencyChange(curr)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                currency === curr
                  ? "bg-emerald-500 text-slate-950 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {curr === "INR" ? "₹ INR" : curr === "USD" ? "$ USD" : "€ EUR"}
            </button>
          ))}
        </div>

        {/* Refresh Data Button */}
        <button
          onClick={onRefresh}
          title="Refresh Financial Data"
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 rounded-lg border border-slate-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* FinPilot AI Trigger Button */}
        <button
          onClick={onOpenAi}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition shadow-sm border ${
            isAiDrawerOpen
              ? "bg-cyan-500 text-slate-950 border-cyan-400"
              : "bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 text-cyan-300 border-cyan-500/30 hover:border-cyan-400 hover:bg-cyan-500/20"
          }`}
        >
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold">Ask FinPilot AI</span>
        </button>

        {/* User profile indicator */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
            {user?.full_name?.charAt(0) || "A"}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-200 leading-none">{user?.full_name || "Alex Mercer"}</p>
            <p className="text-[10px] text-slate-400 leading-none mt-1">{user?.email || "alex@finpilot.io"}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
