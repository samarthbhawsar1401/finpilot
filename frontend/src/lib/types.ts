export interface User {
  id: string;
  email: string;
  full_name: string;
  currency: string;
  is_admin: boolean;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  account_type: "bank" | "cash" | "credit_card" | "investment" | "savings";
  balance: number;
  currency: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  is_system: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id?: string;
  category_id?: string;
  amount: number;
  type: "income" | "expense";
  description: string;
  date: string;
  payment_method: string;
  tags?: string;
  is_recurring?: boolean;
  created_at: string;
  category?: Category;
  account?: Account;
}

export interface BudgetStatus {
  id: string;
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  budgeted_amount: number;
  spent_amount: number;
  remaining_amount: number;
  utilization_percentage: number;
  is_warning: boolean;
  is_exceeded: boolean;
  month: number;
  year: number;
}

export interface GoalContribution {
  id: string;
  goal_id: string;
  user_id: string;
  amount: number;
  date: string;
  notes: string;
  created_at: string;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  category: string;
  status: "active" | "completed" | "paused";
  created_at: string;
  progress_percentage: number;
  remaining_amount: number;
  contributions: GoalContribution[];
}

export interface CategoryBreakdownItem {
  category_id?: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTrendItem {
  month_label: string;
  month_num: number;
  year: number;
  income: number;
  expense: number;
  savings: number;
  savings_rate: number;
}

export interface DashboardSummary {
  total_balance: number;
  total_income_this_month: number;
  total_expenses_this_month: number;
  net_savings_this_month: number;
  savings_rate_this_month: number;
  income_change_pct: number;
  expense_change_pct: number;
  currency: string;
  monthly_trends: MonthlyTrendItem[];
  category_breakdown: CategoryBreakdownItem[];
  budget_statuses: BudgetStatus[];
  active_goals_count: number;
  recent_transactions: Transaction[];
  quick_ai_insights: string[];
}

export interface ForecastChartPoint {
  period: string;
  is_projected: boolean;
  income: number;
  expenses: number;
  net_savings: number;
}

export interface CashFlowForecast {
  avg_monthly_income: number;
  avg_monthly_expenses: number;
  estimated_monthly_savings: number;
  three_month_savings_estimate: number;
  six_month_savings_estimate: number;
  historical_months_analyzed: number;
  trend_direction: "surplus" | "neutral" | "deficit_risk";
  forecast_chart_data: ForecastChartPoint[];
  recommendations: string[];
}

export interface HealthScoreIndicator {
  name: string;
  weight: number;
  score: number;
  weighted_score: number;
  status: "excellent" | "good" | "fair" | "needs_attention" | "unavailable";
  description: string;
  actual_value: string;
}

export interface FinancialHealthScore {
  overall_score: number;
  rating: string;
  summary: string;
  indicators: HealthScoreIndicator[];
  actionable_tips: string[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "finpilot";
  text: string;
  timestamp: string;
  contextUsed?: string;
  suggestedFollowups?: string[];
}

export interface AdminStats {
  total_users: number;
  total_transactions: number;
  total_accounts: number;
  total_budgets: number;
  total_goals: number;
  total_ai_queries: number;
  platform_uptime_days: number;
  system_status: string;
}
