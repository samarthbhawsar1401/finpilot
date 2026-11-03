"use client";

import React, { useState } from "react";
import { X, Coins } from "lucide-react";
import { FinancialGoal } from "@/lib/types";

interface GoalContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: FinancialGoal | null;
  currency: string;
  onContribute: (goalId: string, amount: number, notes?: string) => Promise<void>;
}

export const GoalContributeModal: React.FC<GoalContributeModalProps> = ({
  isOpen,
  onClose,
  goal,
  currency,
  onContribute,
}) => {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setSubmitting(true);
    try {
      await onContribute(goal.id, parseFloat(amount), notes);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-sm rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Coins className="w-4 h-4 text-emerald-400" />
            Contribute Funds
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 mb-4 text-xs">
          <span className="text-slate-400">Target Goal:</span>
          <p className="font-bold text-white text-sm mt-0.5">{goal.title}</p>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>Current: {goal.current_amount}</span>
            <span>Target: {goal.target_amount}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Contribution Amount ({currency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Salary bonus deposit"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {submitting ? "Processing..." : "Confirm Contribution"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
