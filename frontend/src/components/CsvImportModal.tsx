"use client";

import React, { useState } from "react";
import { X, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResultMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.importCsv(file);
      setResultMessage(res.message);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to parse CSV file");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-md rounded-2xl border border-slate-800 bg-[#090d16] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            Import CSV Transactions
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 mb-4 leading-relaxed">
          <p className="font-semibold text-slate-200 mb-1">Supported CSV Columns:</p>
          <code className="text-cyan-400 font-mono text-[10px]">
            Date, Description, Amount, Type, Category, Payment Method, Account
          </code>
          <p className="mt-1 text-slate-500">
            Smart auto-categorization maps unknown items automatically using transaction descriptions.
          </p>
        </div>

        <div className="border-2 border-dashed border-slate-800 hover:border-cyan-500/50 rounded-2xl p-6 text-center transition flex flex-col items-center justify-center cursor-pointer relative bg-slate-950/40">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <FileText className="w-8 h-8 text-cyan-400 mb-2" />
          <p className="text-xs font-semibold text-slate-200">
            {file ? file.name : "Click to select or drop CSV file here"}
          </p>
          <p className="text-[10px] text-slate-500 mt-1">Accepts standard bank & expense CSV exports</p>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resultMessage && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{resultMessage}</span>
          </div>
        )}

        <div className="pt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!file || submitting}
            onClick={handleUpload}
            className="flex-1 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-cyan-500/20 disabled:opacity-40"
          >
            {submitting ? "Importing..." : "Process Import"}
          </button>
        </div>
      </div>
    </div>
  );
};
