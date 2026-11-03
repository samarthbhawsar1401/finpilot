from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
import numpy as np

from app.models.all_models import Transaction, Budget, Account, FinancialGoal
from app.schemas.all_schemas import FinancialHealthScore, HealthScoreIndicator

class HealthScoreService:
    @staticmethod
    def calculate_health_score(db: Session, user_id: str, currency: str = "INR") -> FinancialHealthScore:
        now = datetime.utcnow()
        current_year = now.year
        current_month = now.month
        sym = "₹" if currency == "INR" else ("$" if currency == "USD" else "€")

        transactions = db.query(Transaction).filter(Transaction.user_id == user_id).all()
        accounts = db.query(Account).filter(Account.user_id == user_id, Account.is_active == True).all()
        budgets = db.query(Budget).filter(Budget.user_id == user_id, Budget.month == current_month, Budget.year == current_year).all()
        goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == user_id).all()

        indicators: List[HealthScoreIndicator] = []
        actionable_tips: List[str] = []

        # -------------------------------------------------------------
        # 1. Savings Rate (Weight: 30%)
        # -------------------------------------------------------------
        weight_savings = 30
        this_month_income = sum(t.amount for t in transactions if t.date.year == current_year and t.date.month == current_month and t.type == "income")
        this_month_expense = sum(t.amount for t in transactions if t.date.year == current_year and t.date.month == current_month and t.type == "expense")

        if this_month_income > 0:
            actual_savings_rate = (this_month_income - this_month_expense) / this_month_income * 100
            if actual_savings_rate >= 30:
                s_score = 100.0
                s_status = "excellent"
            elif actual_savings_rate >= 20:
                s_score = 85.0 + (actual_savings_rate - 20) * 1.5
                s_status = "good"
            elif actual_savings_rate >= 10:
                s_score = 65.0 + (actual_savings_rate - 10) * 2.0
                s_status = "fair"
            elif actual_savings_rate > 0:
                s_score = 40.0 + actual_savings_rate * 2.5
                s_status = "needs_attention"
            else:
                s_score = max(5.0, 30.0 + actual_savings_rate)
                s_status = "needs_attention"

            s_val = f"{actual_savings_rate:.1f}% ({sym}{(this_month_income - this_month_expense):,.0f})"
            s_desc = f"You are saving {actual_savings_rate:.1f}% of your monthly income. Financial planners recommend targeting at least 20%."
            if actual_savings_rate < 20:
                actionable_tips.append("Aim to lift your savings rate to 20% by creating auto-transfers on salary day.")
        else:
            s_score = 0.0
            s_status = "unavailable"
            s_val = "No income logged this month"
            s_desc = "Savings rate requires logged income transactions to calculate."

        indicators.append(
            HealthScoreIndicator(
                name="Savings Rate",
                weight=weight_savings,
                score=round(s_score, 1),
                weighted_score=round(s_score * (weight_savings / 100.0), 1),
                status=s_status,
                description=s_desc,
                actual_value=s_val
            )
        )

        # -------------------------------------------------------------
        # 2. Budget Adherence (Weight: 25%)
        # -------------------------------------------------------------
        weight_budget = 25
        if budgets:
            total_budget = sum(b.amount for b in budgets)
            total_spent_in_budgets = 0.0
            exceeded_count = 0

            for b in budgets:
                cat_spent = sum(
                    t.amount for t in transactions 
                    if t.category_id == b.category_id 
                    and t.date.year == current_year 
                    and t.date.month == current_month 
                    and t.type == "expense"
                )
                total_spent_in_budgets += cat_spent
                if cat_spent > b.amount:
                    exceeded_count += 1

            adherence_ratio = (len(budgets) - exceeded_count) / len(budgets)
            if exceeded_count == 0:
                b_score = 100.0
                b_status = "excellent"
                b_val = f"100% adherence ({len(budgets)}/{len(budgets)} within limit)"
                b_desc = "All designated monthly budgets are currently intact with no overruns."
            else:
                b_score = max(20.0, adherence_ratio * 100.0 - 15.0)
                b_status = "needs_attention" if exceeded_count > 1 else "fair"
                b_val = f"{len(budgets) - exceeded_count} of {len(budgets)} budgets within limits"
                b_desc = f"{exceeded_count} categories have breached their budget caps this month."
                actionable_tips.append(f"Rebalance or trim spending in the {exceeded_count} exceeded budget categories.")
        else:
            b_score = 0.0
            b_status = "unavailable"
            b_val = "No budgets set"
            b_desc = "Set monthly category spending limits to track adherence and unlock this indicator."
            actionable_tips.append("Create budgets for your top 3 expense categories (e.g., Dining, Groceries, Shopping).")

        indicators.append(
            HealthScoreIndicator(
                name="Budget Adherence",
                weight=weight_budget,
                score=round(b_score, 1),
                weighted_score=round(b_score * (weight_budget / 100.0), 1),
                status=b_status,
                description=b_desc,
                actual_value=b_val
            )
        )

        # -------------------------------------------------------------
        # 3. Expense Consistency (Weight: 20%)
        # -------------------------------------------------------------
        weight_consistency = 20
        # Group expenses by month
        monthly_expenses: Dict[str, float] = {}
        for t in transactions:
            if t.type == "expense":
                ym = f"{t.date.year}-{t.date.month:02d}"
                monthly_expenses[ym] = monthly_expenses.get(ym, 0.0) + t.amount

        if len(monthly_expenses) >= 2:
            exp_vals = list(monthly_expenses.values())
            mean_exp = np.mean(exp_vals)
            std_exp = np.std(exp_vals)
            cv = (std_exp / mean_exp) if mean_exp > 0 else 0.0

            if cv < 0.15:
                c_score = 95.0
                c_status = "excellent"
                c_val = "Highly Predictable (Low Volatility)"
                c_desc = f"Your monthly expenses fluctuate by less than 15% (Mean: {sym}{mean_exp:,.0f})."
            elif cv < 0.30:
                c_score = 80.0
                c_status = "good"
                c_val = "Moderate Consistency"
                c_desc = f"Your spending fluctuates moderately (Mean: {sym}{mean_exp:,.0f})."
            else:
                c_score = 55.0
                c_status = "fair"
                c_val = "High Variance Detected"
                c_desc = "Substantial month-to-month swings in spending make forecasting more difficult."
                actionable_tips.append("Smooth out large one-off expenses by spreading them into planned sinking funds.")
        else:
            c_score = 0.0
            c_status = "unavailable"
            c_val = "Insufficient historical data"
            c_desc = "Requires at least 2 full months of expense records to evaluate consistency."

        indicators.append(
            HealthScoreIndicator(
                name="Expense Consistency",
                weight=weight_consistency,
                score=round(c_score, 1),
                weighted_score=round(c_score * (weight_consistency / 100.0), 1),
                status=c_status,
                description=c_desc,
                actual_value=c_val
            )
        )

        # -------------------------------------------------------------
        # 4. Emergency Fund Progress (Weight: 15%)
        # -------------------------------------------------------------
        weight_emergency = 15
        total_liquid_cash = sum(a.balance for a in accounts if a.account_type in ["bank", "savings", "cash"])
        emergency_goals = [g for g in goals if "emergency" in g.title.lower()]
        
        # Determine average monthly expense
        avg_burn = (this_month_expense if this_month_expense > 0 else 25000.0)
        months_of_burn_saved = (total_liquid_cash / avg_burn) if avg_burn > 0 else 0.0

        if emergency_goals:
            eg = emergency_goals[0]
            pct = (eg.current_amount / eg.target_amount * 100) if eg.target_amount > 0 else 0.0
            e_score = min(100.0, pct)
            e_status = "excellent" if pct >= 80 else ("good" if pct >= 50 else "needs_attention")
            e_val = f"{pct:.0f}% funded ({sym}{eg.current_amount:,.0f} / {sym}{eg.target_amount:,.0f})"
            e_desc = f"Goal '{eg.title}' covers approx {months_of_burn_saved:.1f} months of baseline living expenses."
        elif months_of_burn_saved >= 3.0:
            e_score = min(100.0, 70.0 + (months_of_burn_saved - 3.0) * 10.0)
            e_status = "excellent" if months_of_burn_saved >= 6.0 else "good"
            e_val = f"{months_of_burn_saved:.1f} months covered ({sym}{total_liquid_cash:,.0f})"
            e_desc = f"Total liquid reserves in your bank and cash accounts represent {months_of_burn_saved:.1f} months of living expenses."
        elif months_of_burn_saved >= 1.0:
            e_score = 50.0 + months_of_burn_saved * 15.0
            e_status = "fair"
            e_val = f"{months_of_burn_saved:.1f} months runway"
            e_desc = f"You hold {sym}{total_liquid_cash:,.0f} liquid cushion. Experts recommend establishing a 3 to 6-month buffer."
            actionable_tips.append("Automate a monthly allocation towards your emergency buffer to reach 3 months runway.")
        else:
            e_score = max(10.0, months_of_burn_saved * 40.0)
            e_status = "needs_attention"
            e_val = f"Under 1 month runway ({sym}{total_liquid_cash:,.0f})"
            e_desc = "Liquid savings are below 1 month of normal expenses, exposing you to unexpected financial shock."
            actionable_tips.append("Prioritize creating an Emergency Fund goal with a starter target of 1 month expenses.")

        indicators.append(
            HealthScoreIndicator(
                name="Emergency Fund Progress",
                weight=weight_emergency,
                score=round(e_score, 1),
                weighted_score=round(e_score * (weight_emergency / 100.0), 1),
                status=e_status,
                description=e_desc,
                actual_value=e_val
            )
        )

        # -------------------------------------------------------------
        # 5. Debt Obligations (Weight: 10%)
        # -------------------------------------------------------------
        weight_debt = 10
        # Check debt repayment expenses
        debt_expense = sum(
            t.amount for t in transactions 
            if (t.category and "debt" in t.category.name.lower()) or "emi" in t.description.lower() or "loan" in t.description.lower()
        )
        credit_card_accounts = [a for a in accounts if a.account_type == "credit_card"]
        cc_negative_balance = sum(abs(min(0.0, a.balance)) for a in credit_card_accounts)

        dti = (debt_expense / this_month_income * 100) if this_month_income > 0 else 0.0

        if dti == 0.0 and cc_negative_balance == 0.0:
            d_score = 100.0
            d_status = "excellent"
            d_val = "0% DTI (Zero Debt Drag)"
            d_desc = "No active loan EMIs or revolving credit liabilities detected."
        elif dti <= 15.0:
            d_score = 90.0
            d_status = "good"
            d_val = f"{dti:.1f}% DTI ({sym}{debt_expense:,.0f}/mo)"
            d_desc = "Debt obligations are well within safe bounds (under 15% of income)."
        elif dti <= 35.0:
            d_score = 65.0
            d_status = "fair"
            d_val = f"{dti:.1f}% DTI ({sym}{debt_expense:,.0f}/mo)"
            d_desc = "Moderate debt obligations. Accelerating principal repayment is advised."
            actionable_tips.append("Evaluate whether debt consolidation can lower your monthly interest rates.")
        else:
            d_score = 35.0
            d_status = "needs_attention"
            d_val = f"{dti:.1f}% DTI (High Burden)"
            d_desc = "Debt payments consume more than 35% of monthly income."
            actionable_tips.append("Apply the Debt Avalanche method (pay highest interest loans first) to reduce interest drain.")

        indicators.append(
            HealthScoreIndicator(
                name="Debt Obligations",
                weight=weight_debt,
                score=round(d_score, 1),
                weighted_score=round(d_score * (weight_debt / 100.0), 1),
                status=d_status,
                description=d_desc,
                actual_value=d_val
            )
        )

        # -------------------------------------------------------------
        # Overall Score Calculation (Normalize over available weights)
        # -------------------------------------------------------------
        available_weights = sum(ind.weight for ind in indicators if ind.status != "unavailable")
        if available_weights > 0:
            raw_sum = sum(ind.score * (ind.weight / 100.0) for ind in indicators if ind.status != "unavailable")
            overall_score = int(round((raw_sum / (available_weights / 100.0))))
        else:
            overall_score = 50

        overall_score = max(0, min(100, overall_score))

        if overall_score >= 85:
            rating = "Excellent"
            summary = "Your financial habits show exemplary discipline across savings, budget control, and reserve cushions."
        elif overall_score >= 70:
            rating = "Good"
            summary = "Solid financial health with healthy fundamentals and minor opportunities for budget optimization."
        elif overall_score >= 50:
            rating = "Moderate"
            summary = "Fair financial position. Stabilizing monthly variance and strengthening your savings buffer will elevate your score."
        else:
            rating = "Vulnerable"
            summary = "High risk profile detected due to low savings rate or budget overspending. Immediate restructuring suggested."

        if not actionable_tips:
            actionable_tips.append("Keep tracking daily expenses to maintain high fidelity in your financial health score.")
            actionable_tips.append("Review your monthly budget at the beginning of each cycle.")

        return FinancialHealthScore(
            overall_score=overall_score,
            rating=rating,
            summary=summary,
            indicators=indicators,
            actionable_tips=actionable_tips[:4]
        )
