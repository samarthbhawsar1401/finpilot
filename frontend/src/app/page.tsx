"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/Navbar";
import { Sidebar, NavTab } from "@/components/Sidebar";
import { DashboardView } from "@/components/DashboardView";
import { TransactionsView } from "@/components/TransactionsView";
import { BudgetsView } from "@/components/BudgetsView";
import { GoalsView } from "@/components/GoalsView";
import { AnalyticsView } from "@/components/AnalyticsView";
import { HealthScoreView } from "@/components/HealthScoreView";
import { AdminView } from "@/components/AdminView";
import { AiAssistantDrawer } from "@/components/AiAssistantDrawer";

import { TransactionModal } from "@/components/TransactionModal";
import { BudgetModal } from "@/components/BudgetModal";
import { GoalModal } from "@/components/GoalModal";
import { GoalContributeModal } from "@/components/GoalContributeModal";
import { CsvImportModal } from "@/components/CsvImportModal";

import {
  User,
  Category,
  Account,
  Transaction,
  BudgetStatus,
  FinancialGoal,
  DashboardSummary,
  CashFlowForecast,
  FinancialHealthScore,
} from "@/lib/types";
import { api } from "@/lib/api";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [currency, setCurrency] = useState("INR");
  const [user, setUser] = useState<User | null>(null);

  // Core Data
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [forecast, setForecast] = useState<CashFlowForecast | null>(null);
  const [healthScore, setHealthScore] = useState<FinancialHealthScore | null>(null);

  // Modals & Drawers
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | null>(null);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState<FinancialGoal | null>(null);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);

  // Initialize and load all data
  const loadAllData = useCallback(async () => {
    try {
      // 1. Ensure demo user session exists
      const loginRes = await api.loginDemo();
      setUser(loginRes.user);
      if (loginRes.user.currency) {
        setCurrency(loginRes.user.currency);
      }

      // 2. Parallel fetch of core resources
      const [sumData, txData, catData, accData, budData, goalData, foreData, healthData] =
        await Promise.all([
          api.getDashboardSummary().catch(() => null),
          api.getTransactions().catch(() => []),
          api.getCategories().catch(() => []),
          api.getAccounts().catch(() => []),
          api.getBudgets().catch(() => []),
          api.getGoals().catch(() => []),
          api.getForecasting().catch(() => null),
          api.getHealthScore().catch(() => null),
        ]);

      if (sumData) setSummary(sumData);
      setTransactions(txData);
      setCategories(catData);
      setAccounts(accData);
      setBudgets(budData);
      setGoals(goalData);
      if (foreData) setForecast(foreData);
      if (healthData) setHealthScore(healthData);
    } catch (err) {
      console.error("Initialization error:", err);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleCurrencyChange = async (newCurr: string) => {
    setCurrency(newCurr);
    try {
      await api.updateProfile({ currency: newCurr });
      loadAllData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAiPrompt = (prompt: string) => {
    setAiInitialPrompt(prompt);
    setIsAiOpen(true);
  };

  // Transaction CRUD handlers
  const handleSaveTransaction = async (data: any) => {
    if (editingTx) {
      await api.updateTransaction(editingTx.id, data);
    } else {
      await api.createTransaction(data);
    }
    loadAllData();
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm("Are you sure you want to delete this transaction record?")) {
      await api.deleteTransaction(id);
      loadAllData();
    }
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  // Budget handlers
  const handleSaveBudget = async (data: any) => {
    await api.createBudget(data);
    loadAllData();
  };

  const handleDeleteBudget = async (id: string) => {
    if (confirm("Remove this category budget?")) {
      await api.deleteBudget(id);
      loadAllData();
    }
  };

  // Goal handlers
  const handleSaveGoal = async (data: any) => {
    await api.createGoal(data);
    loadAllData();
  };

  const handleContributeGoal = async (goalId: string, amount: number, notes?: string) => {
    await api.contributeGoal(goalId, amount, notes);
    loadAllData();
  };

  const handleDeleteGoal = async (id: string) => {
    if (confirm("Delete this savings goal?")) {
      await api.deleteGoal(id);
      loadAllData();
    }
  };

  const handleOpenContribute = (goal: FinancialGoal) => {
    setSelectedGoalForContribution(goal);
    setIsContributeModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        user={user}
        onOpenAi={() => setIsAiOpen(true)}
        onRefresh={loadAllData}
        currency={currency}
        onCurrencyChange={handleCurrencyChange}
        isAiDrawerOpen={isAiOpen}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (tab === "ai") {
              setIsAiOpen(true);
            } else {
              setCurrentTab(tab);
            }
          }}
          totalBalance={summary?.total_balance || 0}
          savingsRate={summary?.savings_rate_this_month || 0}
          currency={currency}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 max-w-7xl mx-auto w-full">
          {currentTab === "dashboard" && (
            <DashboardView
              summary={summary}
              currency={currency}
              onOpenAddTx={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onOpenAiPrompt={handleOpenAiPrompt}
            />
          )}

          {currentTab === "transactions" && (
            <TransactionsView
              transactions={transactions}
              categories={categories}
              accounts={accounts}
              currency={currency}
              onOpenAddTx={() => {
                setEditingTx(null);
                setIsTxModalOpen(true);
              }}
              onOpenImportCsv={() => setIsCsvImportOpen(true)}
              onEditTx={handleEditTransaction}
              onDeleteTx={handleDeleteTransaction}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === "budgets" && (
            <BudgetsView
              budgets={budgets}
              categories={categories}
              currency={currency}
              onOpenAddBudget={() => setIsBudgetModalOpen(true)}
              onDeleteBudget={handleDeleteBudget}
              onOpenAiPrompt={handleOpenAiPrompt}
            />
          )}

          {currentTab === "goals" && (
            <GoalsView
              goals={goals}
              currency={currency}
              onOpenAddGoal={() => setIsGoalModalOpen(true)}
              onOpenContributeModal={handleOpenContribute}
              onDeleteGoal={handleDeleteGoal}
            />
          )}

          {currentTab === "analytics" && (
            <AnalyticsView
              forecast={forecast}
              summary={summary}
              currency={currency}
              onOpenAiPrompt={handleOpenAiPrompt}
            />
          )}

          {currentTab === "health" && (
            <HealthScoreView
              healthScore={healthScore}
              currency={currency}
              onOpenAiPrompt={handleOpenAiPrompt}
            />
          )}

          {currentTab === "admin" && <AdminView />}
        </main>
      </div>

      {/* AI Intelligence Drawer */}
      <AiAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        currency={currency}
        initialPrompt={aiInitialPrompt}
        onClearInitialPrompt={() => setAiInitialPrompt(null)}
      />

      {/* Interactive Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        categories={categories}
        accounts={accounts}
        editingTx={editingTx}
        currency={currency}
        onSave={handleSaveTransaction}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        categories={categories}
        currency={currency}
        onSave={handleSaveBudget}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        currency={currency}
        onSave={handleSaveGoal}
      />

      <GoalContributeModal
        isOpen={isContributeModalOpen}
        onClose={() => {
          setIsContributeModalOpen(false);
          setSelectedGoalForContribution(null);
        }}
        goal={selectedGoalForContribution}
        currency={currency}
        onContribute={handleContributeGoal}
      />

      <CsvImportModal
        isOpen={isCsvImportOpen}
        onClose={() => setIsCsvImportOpen(false)}
        onSuccess={loadAllData}
      />
    </div>
  );
}
