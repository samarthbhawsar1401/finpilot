"use client";

import React, { useState, useEffect } from "react";
import { X, Plus, Edit2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Transaction, Category, Account } from "@/lib/types";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  accounts: Account[];
  editingTx?: Transaction | null;
  currency: string;
  onSave: (data: any) => Promise<void>;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  categories,
  accounts,
  editingTx,
  currency,
  onSave,
}) => {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tags, setTags] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingTx) {
      setType(editingTx.type);
      setDescription(editingTx.description);
      setAmount(editingTx.amount.toString());
      setCategoryId(editingTx.category_id || "");
      setAccountId(editingTx.account_id || "");
      setPaymentMethod(editingTx.payment_method || "UPI");
      setDate(new Date(editingTx.date).toISOString().split("T")[0]);
      setTags(editingTx.tags || "");
      setIsRecurring(editingTx.is_recurring || false);
    } else {
      setType("expense");
      setDescription("");
      setAmount("");
      setCategoryId(categories.length > 0 ? categories[0].id : "");
      setAccountId(accounts.length > 0 ? accounts[0].id : "");
      setPaymentMethod("UPI");
      setDate(new Date().toISOString().split("T")[0]);
      setTags("");
      setIsRecurring(false);
    }
  }, [editingTx, categories, accounts, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    setSubmitting(true);
    try {
      await onSave({
        type,
        description,
        amount: parseFloat(amount),
        category_id: categoryId || undefined,
        account_id: accountId || undefined,
        payment_method: paymentMethod,
        date: new Date(date).toISOString(),
        tags,
        is_recurring: isRecurring,
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
      <div className="glass-card w-full max-w-md rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            {editingTx ? <Edit2 className="w-4 h-4 text-cyan-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
            {editingTx ? "Edit Transaction" : "Record New Transaction"}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Income vs Expense Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                type === "expense"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" /> Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition ${
                type === "income"
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Amount ({currency})
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Description
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Blue Tokai Coffee, Netflix Subscription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category & Account Select */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Tags & Recurring */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              Mark as Recurring Monthly
            </label>
          </div>

          {/* Submit */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {submitting ? "Saving..." : editingTx ? "Update Transaction" : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
