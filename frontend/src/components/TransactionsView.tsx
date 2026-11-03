"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Tag,
  CreditCard,
  CheckCircle2,
  RotateCw
} from "lucide-react";
import { Transaction, Category, Account } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/lib/api";

interface TransactionsViewProps {
  transactions: Transaction[];
  categories: Category[];
  accounts: Account[];
  currency: string;
  onOpenAddTx: () => void;
  onOpenImportCsv: () => void;
  onEditTx: (tx: Transaction) => void;
  onDeleteTx: (id: string) => void;
  onRefresh: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  categories,
  accounts,
  currency,
  onOpenAddTx,
  onOpenImportCsv,
  onEditTx,
  onDeleteTx,
  onRefresh,
}) => {
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | "income" | "expense">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedAccount, setSelectedAccount] = useState<string>("all");

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (selectedType !== "all" && tx.type !== selectedType) return false;
      // Category filter
      if (selectedCategory !== "all" && tx.category_id !== selectedCategory) return false;
      // Account filter
      if (selectedAccount !== "all" && tx.account_id !== selectedAccount) return false;
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const descMatch = tx.description.toLowerCase().includes(q);
        const catMatch = tx.category?.name?.toLowerCase().includes(q);
        const methodMatch = tx.payment_method?.toLowerCase().includes(q);
        const tagMatch = tx.tags?.toLowerCase().includes(q);
        if (!descMatch && !catMatch && !methodMatch && !tagMatch) return false;
      }
      return true;
    });
  }, [transactions, search, selectedType, selectedCategory, selectedAccount]);

  const handleExportCsv = () => {
    window.open(api.getExportCsvUrl(), "_blank");
  };

  return (
    <div className="space-y-5">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Transaction Management</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Record, filter, search, import, and export all income and expense ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={onOpenImportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Import CSV
          </button>

          <button
            onClick={onOpenAddTx}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search transactions, tags, merchants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Type Toggle */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
            {(["all", "income", "expense"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition ${
                  selectedType === t
                    ? "bg-slate-800 text-emerald-400 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Account Dropdown */}
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Description</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Account & Method</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold text-right">Amount</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {filtered.length > 0 ? (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-900/50 transition group">
                    {/* Description */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            tx.type === "income"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-rose-500/10 text-rose-400"
                          }`}
                        >
                          {tx.type === "income" ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                            {tx.description}
                            {tx.is_recurring && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 border border-cyan-500/20">
                                Recurring
                              </span>
                            )}
                          </div>
                          {tx.tags && (
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" /> {tx.tags}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4">
                      <span
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium inline-block border"
                        style={{
                          backgroundColor: `${tx.category?.color || "#64748b"}15`,
                          borderColor: `${tx.category?.color || "#64748b"}30`,
                          color: tx.category?.color || "#94a3b8",
                        }}
                      >
                        {tx.category?.name || "General"}
                      </span>
                    </td>

                    {/* Account & Payment Method */}
                    <td className="py-3 px-4 text-slate-400">
                      <div className="font-medium text-slate-300">
                        {tx.account?.name || "Default Account"}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {tx.payment_method || "UPI"}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-slate-400">{formatDate(tx.date)}</td>

                    {/* Amount */}
                    <td
                      className={`py-3 px-4 text-right font-bold text-sm ${
                        tx.type === "income" ? "text-emerald-400" : "text-slate-100"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount, currency)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onEditTx(tx)}
                          className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTx(tx.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No transactions matching your criteria. Try adjusting filters or click "Add Transaction".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
