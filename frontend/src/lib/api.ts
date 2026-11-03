import {
  User,
  Account,
  Category,
  Transaction,
  BudgetStatus,
  FinancialGoal,
  DashboardSummary,
  CashFlowForecast,
  FinancialHealthScore,
  AdminStats,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

function getAuthHeader(): Record<string, string> {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("finpilot_token");
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errData.detail || `Request failed with status ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (error: any) {
    console.error(`API Error on [${options.method || "GET"} ${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  async loginDemo(): Promise<{ access_token: string; user: User }> {
    const data = await request<{ access_token: string; user: User }>("/auth/demo-login", {
      method: "POST",
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("finpilot_token", data.access_token);
      localStorage.setItem("finpilot_user", JSON.stringify(data.user));
    }
    return data;
  },

  async getProfile(): Promise<User> {
    return request<User>("/auth/me");
  },

  async updateProfile(updates: { full_name?: string; currency?: string }): Promise<User> {
    return request<User>("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },

  // Dashboard & Analytics
  async getDashboardSummary(): Promise<DashboardSummary> {
    return request<DashboardSummary>("/analytics/dashboard");
  },

  async getForecasting(): Promise<CashFlowForecast> {
    return request<CashFlowForecast>("/forecasting");
  },

  async getHealthScore(): Promise<FinancialHealthScore> {
    return request<FinancialHealthScore>("/health-score");
  },

  // Transactions
  async getTransactions(params?: {
    search?: string;
    type?: string;
    category_id?: string;
    account_id?: string;
    limit?: number;
  }): Promise<Transaction[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.type && params.type !== "all") query.append("type", params.type);
    if (params?.category_id) query.append("category_id", params.category_id);
    if (params?.account_id) query.append("account_id", params.account_id);
    if (params?.limit) query.append("limit", params.limit.toString());

    return request<Transaction[]>(`/transactions?${query.toString()}`);
  },

  async createTransaction(tx: {
    amount: number;
    type: "income" | "expense";
    description: string;
    category_id?: string;
    account_id?: string;
    date?: string;
    payment_method?: string;
    tags?: string;
    is_recurring?: boolean;
  }): Promise<Transaction> {
    return request<Transaction>("/transactions", {
      method: "POST",
      body: JSON.stringify(tx),
    });
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    return request<Transaction>(`/transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  },

  async deleteTransaction(id: string): Promise<{ message: string; id: string }> {
    return request<{ message: string; id: string }>(`/transactions/${id}`, {
      method: "DELETE",
    });
  },

  getExportCsvUrl(): string {
    return `${BASE_URL}/transactions/export/csv`;
  },

  async importCsv(file: File): Promise<{ message: string; imported_count: number }> {
    const formData = new FormData();
    formData.append("file", file);
    const headers = getAuthHeader();
    const res = await fetch(`${BASE_URL}/transactions/import/csv`, {
      method: "POST",
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: "CSV upload failed" }));
      throw new Error(err.detail);
    }
    return res.json();
  },

  // Accounts
  async getAccounts(): Promise<Account[]> {
    return request<Account[]>("/accounts");
  },

  async createAccount(acc: { name: string; account_type: string; balance: number }): Promise<Account> {
    return request<Account>("/accounts", {
      method: "POST",
      body: JSON.stringify(acc),
    });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    return request<Category[]>("/categories");
  },

  // Budgets
  async getBudgets(month?: number, year?: number): Promise<BudgetStatus[]> {
    const query = new URLSearchParams();
    if (month) query.append("month", month.toString());
    if (year) query.append("year", year.toString());
    return request<BudgetStatus[]>(`/budgets?${query.toString()}`);
  },

  async createBudget(b: { category_id: string; amount: number; month: number; year: number; alert_threshold?: number }): Promise<any> {
    return request<any>("/budgets", {
      method: "POST",
      body: JSON.stringify(b),
    });
  },

  async deleteBudget(id: string): Promise<any> {
    return request<any>(`/budgets/${id}`, {
      method: "DELETE",
    });
  },

  // Goals
  async getGoals(): Promise<FinancialGoal[]> {
    return request<FinancialGoal[]>("/goals");
  },

  async createGoal(g: { title: string; target_amount: number; current_amount?: number; deadline?: string; category?: string }): Promise<FinancialGoal> {
    return request<FinancialGoal>("/goals", {
      method: "POST",
      body: JSON.stringify(g),
    });
  },

  async contributeGoal(id: string, amount: number, notes?: string): Promise<FinancialGoal> {
    return request<FinancialGoal>(`/goals/${id}/contribute`, {
      method: "POST",
      body: JSON.stringify({ amount, notes: notes || "" }),
    });
  },

  async deleteGoal(id: string): Promise<any> {
    return request<any>(`/goals/${id}`, {
      method: "DELETE",
    });
  },

  // AI Assistant
  async sendAiQuery(message: string): Promise<{ reply: string; context_used?: string; suggested_followups?: string[] }> {
    return request<{ reply: string; context_used?: string; suggested_followups?: string[] }>("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },

  // Admin & Monitoring
  async getAdminStats(): Promise<AdminStats> {
    return request<AdminStats>("/admin/stats");
  },
};
