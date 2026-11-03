from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth & User ---
class UserRegister(BaseModel):
    email: str
    full_name: str
    password: str
    currency: Optional[str] = "INR"

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    currency: str
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    currency: Optional[str] = None

# --- Accounts ---
class AccountBase(BaseModel):
    name: str
    account_type: str = "bank"  # bank, cash, credit_card, investment, savings
    balance: float = 0.0
    currency: Optional[str] = "INR"

class AccountCreate(AccountBase):
    pass

class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    balance: Optional[float] = None
    currency: Optional[str] = None
    is_active: Optional[bool] = None

class AccountResponse(AccountBase):
    id: str
    user_id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Categories ---
class CategoryBase(BaseModel):
    name: str
    type: str  # 'income' or 'expense'
    icon: Optional[str] = "Tag"
    color: Optional[str] = "#10b981"

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: str
    user_id: Optional[str] = None
    is_system: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Transactions ---
class TransactionBase(BaseModel):
    account_id: Optional[str] = None
    category_id: Optional[str] = None
    amount: float
    type: str  # 'income' or 'expense'
    description: str
    date: Optional[datetime] = None
    payment_method: Optional[str] = "UPI"
    tags: Optional[str] = ""
    is_recurring: Optional[bool] = False

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    account_id: Optional[str] = None
    category_id: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    payment_method: Optional[str] = None
    tags: Optional[str] = None
    is_recurring: Optional[bool] = None

class TransactionResponse(TransactionBase):
    id: str
    user_id: str
    created_at: datetime
    category: Optional[CategoryResponse] = None
    account: Optional[AccountResponse] = None

    class Config:
        from_attributes = True

# --- Budgets ---
class BudgetCreate(BaseModel):
    category_id: str
    amount: float
    period: Optional[str] = "monthly"
    month: int
    year: int
    alert_threshold: Optional[float] = 80.0

class BudgetUpdate(BaseModel):
    amount: Optional[float] = None
    alert_threshold: Optional[float] = None

class BudgetResponse(BaseModel):
    id: str
    user_id: str
    category_id: str
    amount: float
    period: str
    month: int
    year: int
    alert_threshold: float
    created_at: datetime
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True

class BudgetStatusResponse(BaseModel):
    id: str
    category_id: str
    category_name: str
    category_color: str
    category_icon: str
    budgeted_amount: float
    spent_amount: float
    remaining_amount: float
    utilization_percentage: float
    is_warning: bool  # >= alert_threshold (e.g. 80%)
    is_exceeded: bool # > 100%
    month: int
    year: int

# --- Goals & Contributions ---
class GoalContributionCreate(BaseModel):
    amount: float
    notes: Optional[str] = ""
    date: Optional[datetime] = None

class GoalContributionResponse(BaseModel):
    id: str
    goal_id: str
    user_id: str
    amount: float
    date: datetime
    notes: str
    created_at: datetime

    class Config:
        from_attributes = True

class GoalCreate(BaseModel):
    title: str
    target_amount: float
    current_amount: Optional[float] = 0.0
    deadline: Optional[datetime] = None
    category: Optional[str] = "Savings"

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    target_amount: Optional[float] = None
    current_amount: Optional[float] = None
    deadline: Optional[datetime] = None
    category: Optional[str] = None
    status: Optional[str] = None

class GoalResponse(BaseModel):
    id: str
    user_id: str
    title: str
    target_amount: float
    current_amount: float
    deadline: Optional[datetime] = None
    category: str
    status: str
    created_at: datetime
    progress_percentage: float
    remaining_amount: float
    contributions: List[GoalContributionResponse] = []

    class Config:
        from_attributes = True

# --- Analytics, Health & AI ---
class CategoryBreakdownItem(BaseModel):
    category_id: Optional[str]
    name: str
    color: str
    icon: str
    amount: float
    percentage: float

class MonthlyTrendItem(BaseModel):
    month_label: str  # e.g. "Oct 2026"
    month_num: int
    year: int
    income: float
    expense: float
    savings: float
    savings_rate: float

class DashboardSummary(BaseModel):
    total_balance: float
    total_income_this_month: float
    total_expenses_this_month: float
    net_savings_this_month: float
    savings_rate_this_month: float
    income_change_pct: float
    expense_change_pct: float
    currency: str
    monthly_trends: List[MonthlyTrendItem]
    category_breakdown: List[CategoryBreakdownItem]
    budget_statuses: List[BudgetStatusResponse]
    active_goals_count: int
    recent_transactions: List[TransactionResponse]
    quick_ai_insights: List[str]

class CashFlowForecast(BaseModel):
    avg_monthly_income: float
    avg_monthly_expenses: float
    estimated_monthly_savings: float
    three_month_savings_estimate: float
    six_month_savings_estimate: float
    historical_months_analyzed: int
    trend_direction: str  # "surplus", "neutral", "deficit_risk"
    forecast_chart_data: List[Dict[str, Any]]
    recommendations: List[str]

class HealthScoreIndicator(BaseModel):
    name: str
    weight: int  # percentage weight, e.g. 30
    score: float # 0 to 100
    weighted_score: float
    status: str # "excellent", "good", "fair", "needs_attention", "unavailable"
    description: str
    actual_value: str

class FinancialHealthScore(BaseModel):
    overall_score: int # 0 to 100
    rating: str # "Excellent", "Good", "Moderate", "Vulnerable"
    summary: str
    indicators: List[HealthScoreIndicator]
    actionable_tips: List[str]

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    context_used: Optional[str] = None
    suggested_followups: List[str] = []

class AdminStatsResponse(BaseModel):
    total_users: int
    total_transactions: int
    total_accounts: int
    total_budgets: int
    total_goals: int
    total_ai_queries: int
    platform_uptime_days: float
    system_status: str
