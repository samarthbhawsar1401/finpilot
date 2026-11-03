"use client";

import React, { useState } from "react";
import { X, Target } from "lucide-react";

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  onSave: (data: any) => Promise<void>;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  currency,
  onSave,
}) => {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] = useState("Savings");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;

    setSubmitting(true);
    try {
      await onSave({
        title,
        target_amount: parseFloat(targetAmount),
        current_amount: currentAmount ? parseFloat(currentAmount) : 0,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        category,
      });
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
            <Target className="w-4 h-4 text-emerald-400" />
            Create Savings Goal
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Goal Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Emergency Fund (6 Months), New Car"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Target ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="200000"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Initial Saved ({currency})
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Emergency Fund">Emergency Fund</option>
                <option value="Tech Gadgets">Tech Gadgets</option>
                <option value="Travel">Travel</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Investment">Investment</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Target Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Start Tracking Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
