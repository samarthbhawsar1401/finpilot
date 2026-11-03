"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, Sparkles, User as UserIcon, RefreshCw, ChevronRight } from "lucide-react";
import { ChatMessage } from "@/lib/types";
import { api } from "@/lib/api";

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  currency,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "finpilot",
      text: `Hello! I am **FinPilot Intelligence**, your personal financial intelligence agent. I analyze your recorded income, expenses, active budgets, and savings goals to give you data-backed insights.\n\nAsk me anything or tap one of the suggested prompts below!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedFollowups: [
        "Where did I spend the most this month?",
        "How can I save ₹5,000 this month?",
        "Explain my budget adherence",
        "Forecast my 3-month cash flow",
      ],
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle incoming initial prompt
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleSend(initialPrompt);
      if (onClearInitialPrompt) onClearInitialPrompt();
    }
  }, [initialPrompt]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await api.sendAiQuery(textToSend);
      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "finpilot",
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        contextUsed: res.context_used,
        suggestedFollowups: res.suggested_followups,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: "finpilot",
        text: `⚠️ Apologies, I encountered a temporary error analyzing your financial ledger: ${err.message}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#090d16] border-l border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">FinPilot Intelligence</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                Live Data Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Strictly grounded on your verifiable ledger</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => {
          const isUser = m.sender === "user";
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div className="flex items-start gap-2.5 max-w-[90%]">
                {!isUser && (
                  <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mt-1 shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? "bg-emerald-500 text-slate-950 font-medium rounded-tr-none"
                      : "bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-md"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>

                  {m.contextUsed && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                      🔍 {m.contextUsed}
                    </div>
                  )}
                </div>
              </div>

              {/* Followups chips if present */}
              {!isUser && m.suggestedFollowups && m.suggestedFollowups.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5 ml-8 max-w-[85%]">
                  {m.suggestedFollowups.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(chip)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-800 hover:border-cyan-500/40 transition text-left"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              <span className="text-[10px] text-slate-500 mt-1 px-1">{m.timestamp}</span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mt-1 shrink-0">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>FinPilot is analyzing your financial data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/80">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Ask about spending, budgets, savings..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50 transition"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold transition shadow-md shadow-cyan-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
