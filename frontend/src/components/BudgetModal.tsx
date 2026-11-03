"use client";

import React, { useState } from "react";
import { X, PieChart } from "lucide-react";
import { Category } from "@/lib/types";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  currency: string;
  onSave: (data: any) => Promise<void>;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  categories,
  currency,
  onSave,
}) => {
  const now = new Date();
  const [categoryId, setCategoryId] = useState(categories.length > 0 ? categories[0].id : "");
  const [amount, setAmount] = useState("");
  const [alertThreshold, setAlertThreshold] = useState("80");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !categoryId) return;

    setSubmitting(true);
    try {
      await onSave({
        category_id: categoryId,
        amount: parseFloat(amount),
        alert_threshold: parseFloat(alertThreshold),
        month,
        year,
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
            <PieChart className="w-4 h-4 text-emerald-400" />
            Set Category Budget
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {categories
                .filter((c) => c.type === "expense")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Monthly Limit ({currency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 8000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Warning Alert Threshold (%)
            </label>
            <input
              type="number"
              min="50"
              max="100"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Triggers visual alert when spending reaches {alertThreshold}% of this budget.
            </span>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Budget Limit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
