from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd
import numpy as np

from app.models.all_models import Transaction, Budget, Category, Account, FinancialGoal
from app.schemas.all_schemas import (
    DashboardSummary,
    CategoryBreakdownItem,
    MonthlyTrendItem,
    BudgetStatusResponse,
    TransactionResponse
)

class AnalyticsService:
    @staticmethod
    def get_dashboard_summary(db: Session, user_id: str, currency: str = "INR") -> DashboardSummary:
        now = datetime.utcnow()
        current_year = now.year
        current_month = now.month

        # Calculate total account balance
        accounts = db.query(Account).filter(Account.user_id == user_id, Account.is_active == True).all()
        total_balance = sum(a.balance for a in accounts)

        # Get all transactions for user
        transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
        
        # Recent transactions (latest 8)
        recent_txs = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .order_by(Transaction.date.desc())
            .limit(8)
            .all()
        )
        recent_tx_responses = [TransactionResponse.from_orm(t) for t in recent_txs]

        # Calculate current month vs last month using python / pandas
        this_month_income = 0.0
        this_month_expense = 0.0
        last_month_income = 0.0
        last_month_expense = 0.0

        prev_month_year = current_year if current_month > 1 else current_year - 1
        prev_month = current_month - 1 if current_month > 1 else 12

        category_spend: Dict[str, Dict[str, Any]] = {}

        for tx in transactions:
            tx_date = tx.date
            if tx_date.year == current_year and tx_date.month == current_month:
                if tx.type == "income":
                    this_month_income += tx.amount
                elif tx.type == "expense":
                    this_month_expense += tx.amount
                    # Category aggregation for current month
                    cat_id = tx.category_id or "uncategorized"
                    cat_name = tx.category.name if tx.category else "Other"
                    cat_color = tx.category.color if tx.category else "#64748b"
                    cat_icon = tx.category.icon if tx.category else "Tag"

                    if cat_id not in category_spend:
                        category_spend[cat_id] = {
                            "name": cat_name,
                            "color": cat_color,
                            "icon": cat_icon,
                            "amount": 0.0
                        }
                    category_spend[cat_id]["amount"] += tx.amount

            elif tx_date.year == prev_month_year and tx_date.month == prev_month:
                if tx.type == "income":
                    last_month_income += tx.amount
                elif tx.type == "expense":
                    last_month_expense += tx.amount

        net_savings_this_month = this_month_income - this_month_expense
        savings_rate = (net_savings_this_month / this_month_income * 100) if this_month_income > 0 else 0.0

        # Percentage changes
        income_change_pct = (
            ((this_month_income - last_month_income) / last_month_income * 100)
            if last_month_income > 0 else 0.0
        )
        expense_change_pct = (
            ((this_month_expense - last_month_expense) / last_month_expense * 100)
            if last_month_expense > 0 else 0.0
        )

        # Category Breakdown
        category_breakdown: List[CategoryBreakdownItem] = []
        for cat_id, data in sorted(category_spend.items(), key=lambda x: x[1]["amount"], reverse=True):
            pct = (data["amount"] / this_month_expense * 100) if this_month_expense > 0 else 0.0
            category_breakdown.append(
                CategoryBreakdownItem(
                    category_id=cat_id if cat_id != "uncategorized" else None,
                    name=data["name"],
                    color=data["color"],
                    icon=data["icon"],
                    amount=round(data["amount"], 2),
                    percentage=round(pct, 1)
                )
            )

        # Monthly Trends (last 6 months)
        monthly_trends = AnalyticsService.get_monthly_trends(transactions, months_count=6)

        # Budget Statuses for current month
        budgets = (
            db.query(Budget)
            .filter(Budget.user_id == user_id, Budget.month == current_month, Budget.year == current_year)
            .all()
        )
        budget_statuses: List[BudgetStatusResponse] = []
        for b in budgets:
            spent = category_spend.get(b.category_id, {}).get("amount", 0.0)
            utilization = (spent / b.amount * 100) if b.amount > 0 else 0.0
            cat_name = b.category.name if b.category else "Category"
            cat_color = b.category.color if b.category else "#6366f1"
            cat_icon = b.category.icon if b.category else "Wallet"

            budget_statuses.append(
                BudgetStatusResponse(
                    id=b.id,
                    category_id=b.category_id,
                    category_name=cat_name,
                    category_color=cat_color,
                    category_icon=cat_icon,
                    budgeted_amount=round(b.amount, 2),
                    spent_amount=round(spent, 2),
                    remaining_amount=round(max(0.0, b.amount - spent), 2),
                    utilization_percentage=round(utilization, 1),
                    is_warning=utilization >= b.alert_threshold and utilization <= 100,
                    is_exceeded=utilization > 100,
                    month=b.month,
                    year=b.year
                )
            )

        # Active Goals Count
        active_goals_count = db.query(FinancialGoal).filter(
            FinancialGoal.user_id == user_id,
            FinancialGoal.status == "active"
        ).count()

        # Generate Quick AI Insights
        quick_ai_insights = AnalyticsService.generate_quick_insights(
            this_month_income=this_month_income,
            this_month_expense=this_month_expense,
            savings_rate=savings_rate,
            expense_change_pct=expense_change_pct,
            category_breakdown=category_breakdown,
            budget_statuses=budget_statuses,
            currency=currency
        )

        return DashboardSummary(
            total_balance=round(total_balance, 2),
            total_income_this_month=round(this_month_income, 2),
            total_expenses_this_month=round(this_month_expense, 2),
            net_savings_this_month=round(net_savings_this_month, 2),
            savings_rate_this_month=round(savings_rate, 1),
            income_change_pct=round(income_change_pct, 1),
            expense_change_pct=round(expense_change_pct, 1),
            currency=currency,
            monthly_trends=monthly_trends,
            category_breakdown=category_breakdown,
            budget_statuses=budget_statuses,
            active_goals_count=active_goals_count,
            recent_transactions=recent_tx_responses,
            quick_ai_insights=quick_ai_insights
        )

    @staticmethod
    def get_monthly_trends(transactions: List[Transaction], months_count: int = 6) -> List[MonthlyTrendItem]:
        now = datetime.utcnow()
        result = []
        
        # Build month list
        months = []
        for i in range(months_count - 1, -1, -1):
            target_date = now - timedelta(days=i * 30.5)
            months.append((target_date.year, target_date.month))
        # Deduplicate while preserving order
        unique_months = []
        for m in months:
            if m not in unique_months:
                unique_months.append(m)

        for year, month in unique_months:
            m_income = 0.0
            m_expense = 0.0
            for tx in transactions:
                if tx.date.year == year and tx.date.month == month:
                    if tx.type == "income":
                        m_income += tx.amount
                    elif tx.type == "expense":
                        m_expense += tx.amount

            savings = m_income - m_expense
            rate = (savings / m_income * 100) if m_income > 0 else 0.0
            dt = datetime(year, month, 1)
            month_label = dt.strftime("%b %Y")

            result.append(
                MonthlyTrendItem(
                    month_label=month_label,
                    month_num=month,
                    year=year,
                    income=round(m_income, 2),
                    expense=round(m_expense, 2),
                    savings=round(savings, 2),
                    savings_rate=round(rate, 1)
                )
            )

        return result

    @staticmethod
    def generate_quick_insights(
        this_month_income: float,
        this_month_expense: float,
        savings_rate: float,
        expense_change_pct: float,
        category_breakdown: List[CategoryBreakdownItem],
        budget_statuses: List[BudgetStatusResponse],
        currency: str
    ) -> List[str]:
        insights = []
        sym = "₹" if currency == "INR" else ("$" if currency == "USD" else "€")

        # Spending change insight
        if expense_change_pct > 15:
            insights.append(f"Spending alert: Your monthly expenses jumped by {expense_change_pct:.1f}% compared to last month.")
        elif expense_change_pct < -10:
            insights.append(f"Great discipline: Your spending decreased by {abs(expense_change_pct):.1f}% compared to last month.")

        # Highest spending category
        if category_breakdown:
            top_cat = category_breakdown[0]
            insights.append(f"Highest spending area is {top_cat.name} consuming {top_cat.percentage:.1f}% ({sym}{top_cat.amount:,.0f}) of total monthly expenses.")

        # Budget warnings
        exceeded_budgets = [b for b in budget_statuses if b.is_exceeded]
        warning_budgets = [b for b in budget_statuses if b.is_warning]
        if exceeded_budgets:
            insights.append(f"Over budget in {exceeded_budgets[0].category_name} ({exceeded_budgets[0].utilization_percentage:.0f}% utilized). Review remaining discretionary spend.")
        elif warning_budgets:
            insights.append(f"Budget threshold alert: {warning_budgets[0].category_name} is at {warning_budgets[0].utilization_percentage:.0f}% of its allocated limit.")

        # Savings rate feedback
        if savings_rate >= 30:
            insights.append(f"Your savings rate is strong at {savings_rate:.1f}%, exceeding the 20% benchmark standard.")
        elif savings_rate > 0:
            insights.append(f"Current savings rate is {savings_rate:.1f}%. Trimming non-essential subscriptions could elevate this towards 25%.")
        else:
            insights.append("Net cash flow is currently negative for this period. Priority should be given to trimming discretionary costs.")

        return insights[:4]
