from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
import os

from app.core.config import settings
from app.models.all_models import Transaction, Budget, Category, Account, FinancialGoal, AiInteraction
from app.schemas.all_schemas import ChatResponse
from app.services.analytics_service import AnalyticsService
from app.services.forecasting_service import ForecastingService
from app.services.health_score_service import HealthScoreService

class AiService:
    @staticmethod
    def answer_query(db: Session, user_id: str, prompt: str, currency: str = "INR") -> ChatResponse:
        now = datetime.utcnow()
        current_year = now.year
        current_month = now.month
        sym = "₹" if currency == "INR" else ("$" if currency == "USD" else "€")

        # 1. Fetch live user financial context
        summary = AnalyticsService.get_dashboard_summary(db, user_id, currency)
        forecast = ForecastingService.calculate_forecast(db, user_id, currency)
        health = HealthScoreService.calculate_health_score(db, user_id, currency)
        goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == user_id).all()
        transactions = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .order_by(Transaction.date.desc())
            .limit(30)
            .all()
        )

        # Build context summary string
        top_cats = ", ".join([f"{c.name}: {sym}{c.amount:,.0f} ({c.percentage}%)" for c in summary.category_breakdown[:4]])
        budget_alerts = [f"{b.category_name} ({b.utilization_percentage:.0f}% spent)" for b in summary.budget_statuses if b.is_warning or b.is_exceeded]
        budget_alerts_str = ", ".join(budget_alerts) if budget_alerts else "All budgets within healthy thresholds."
        goals_str = ", ".join([f"{g.title} ({sym}{g.current_amount:,.0f}/{sym}{g.target_amount:,.0f})" for g in goals]) if goals else "No active savings goals."

        context_str = f"""
Financial Context:
- Currency: {currency} ({sym})
- Current Month Income: {sym}{summary.total_income_this_month:,.2f}
- Current Month Expenses: {sym}{summary.total_expenses_this_month:,.2f}
- Net Monthly Savings: {sym}{summary.net_savings_this_month:,.2f} (Savings Rate: {summary.savings_rate_this_month}%)
- Month-over-Month Expense Change: {summary.expense_change_pct:+.1f}%
- Total Account Balance: {sym}{summary.total_balance:,.2f}
- Financial Health Score: {health.overall_score}/100 ({health.rating})
- Top Expense Categories: {top_cats}
- Budget Overruns / Warnings: {budget_alerts_str}
- 3-Month Rolling Avg Expenses: {sym}{forecast.avg_monthly_expenses:,.0f}
- Projected 3-Month Savings: {sym}{forecast.three_month_savings_estimate:,.0f}
- Goals: {goals_str}
"""

        # 2. Attempt OpenAI if key is configured
        reply = None
        used_model = "finpilot-local-intelligence"

        if settings.OPENAI_API_KEY and len(settings.OPENAI_API_KEY.strip()) > 10:
            try:
                from openai import OpenAI
                client = OpenAI(api_key=settings.OPENAI_API_KEY)
                system_instruction = (
                    "You are FinPilot Intelligence, an elite personal financial advisor and intelligence agent. "
                    "Analyze the user's inquiry strictly based on their real financial context provided. "
                    "Cite actual figures, percentages, and category names. Do not invent numbers. "
                    "Be insightful, concise, highly encouraging, and provide clear actionable steps. "
                    "Format with clean markdown bullets and bold numbers where appropriate."
                )
                completion = client.chat.completions.create(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": f"{system_instruction}\n\n{context_str}"},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=600,
                    temperature=0.3
                )
                reply = completion.choices[0].message.content
                used_model = f"openai-{settings.OPENAI_MODEL}"
            except Exception as e:
                # Fall back gracefully to built-in rule-based engine
                reply = None

        # 3. If OpenAI was not used or failed, run FinPilot's Built-in Intelligence Engine
        if not reply:
            reply = AiService.generate_rule_based_response(
                prompt=prompt,
                summary=summary,
                forecast=forecast,
                health=health,
                transactions=transactions,
                goals=goals,
                sym=sym
            )

        # 4. Save interaction log in DB
        try:
            log_entry = AiInteraction(
                user_id=user_id,
                prompt=prompt,
                response=reply,
                tokens_used=len(reply.split()),
                model=used_model
            )
            db.add(log_entry)
            db.commit()
        except Exception:
            db.rollback()

        # Followup recommendations
        followups = [
            "How can I improve my financial health score?",
            "What is my projected 3-month cash flow?",
            "Audit my recurring subscriptions and variable spend",
            "Where did I overspend this month?"
        ]

        return ChatResponse(
            reply=reply,
            context_used=f"Grounded on your actual ledger: {sym}{summary.total_expenses_this_month:,.0f} spend across {len(summary.category_breakdown)} categories.",
            suggested_followups=[f for f in followups if f.lower() not in prompt.lower()][:3]
        )

    @staticmethod
    def generate_rule_based_response(
        prompt: str,
        summary: Any,
        forecast: Any,
        health: Any,
        transactions: List[Transaction],
        goals: List[FinancialGoal],
        sym: str
    ) -> str:
        p = prompt.lower()

        # Topic 1: Spending patterns / Where did money go / Overview
        if any(w in p for w in ["spend", "spending", "where", "money go", "overview", "summary", "month"]):
            lines = [
                f"### 📊 Monthly Financial Overview",
                f"Here is your real-time financial snapshot for this billing cycle:",
                f"",
                f"- **Total Income**: {sym}{summary.total_income_this_month:,.2f}",
                f"- **Total Expenses**: {sym}{summary.total_expenses_this_month:,.2f}",
                f"- **Net Savings**: **{sym}{summary.net_savings_this_month:,.2f}** ({summary.savings_rate_this_month}% savings rate)",
                f"- **Month-over-Month Delta**: Expenses changed by **{summary.expense_change_pct:+.1f}%** compared to the prior month.",
                f""
            ]
            if summary.category_breakdown:
                lines.append("#### Top Expense Categories:")
                for cat in summary.category_breakdown[:3]:
                    lines.append(f"- **{cat.name}**: {sym}{cat.amount:,.2f} ({cat.percentage}% of all expenses)")
            
            if summary.expense_change_pct > 10:
                lines.append(f"\n⚠️ **Insight**: Your spending accelerated by {summary.expense_change_pct:.1f}% this month. Revisit discretionary dining or impulse purchases to preserve cash flow.")
            else:
                lines.append(f"\n✅ **Insight**: Your spending is under control with a healthy {summary.savings_rate_this_month}% savings rate.")
            return "\n".join(lines)

        # Topic 2: Food / Dining / Groceries
        if any(w in p for w in ["food", "dining", "eat", "grocery", "groceries", "restaurant"]):
            food_txs = [t for t in transactions if t.category and t.category.name.lower() in ["dining", "food", "groceries"]]
            food_total = sum(t.amount for t in food_txs)
            return (
                f"### 🍽️ Food & Dining Intelligence\n\n"
                f"Across recent records, your food and dining expenses total **{sym}{food_total:,.2f}**.\n\n"
                f"- **Recent Transactions logged**: {len(food_txs)}\n"
                f"- **Average Ticket Size**: {sym}{(food_total / len(food_txs) if food_txs else 0):,.2f}\n\n"
                f"💡 **Recommendation**: If you meal-prep 2 additional meals per week, you could trim food expenditures by an estimated **{sym}{(food_total * 0.18):,.2f}** monthly without sacrificing quality of life."
            )

        # Topic 3: Budget / Overspending
        if any(w in p for w in ["budget", "overspend", "limit", "warning"]):
            lines = ["### 🎯 Budget Adherence Breakdown\n"]
            if not summary.budget_statuses:
                lines.append("You currently have no active category budgets configured. Setting limits on *Dining*, *Groceries*, and *Shopping* is recommended to prevent overspending.")
            else:
                for b in summary.budget_statuses:
                    status_icon = "🔴" if b.is_exceeded else ("🟡" if b.is_warning else "🟢")
                    lines.append(f"- {status_icon} **{b.category_name}**: {sym}{b.spent_amount:,.0f} / {sym}{b.budgeted_amount:,.0f} ({b.utilization_percentage:.1f}% used) — Remaining: {sym}{b.remaining_amount:,.0f}")
                
                over = [b for b in summary.budget_statuses if b.is_exceeded]
                if over:
                    lines.append(f"\n⚠️ **Action Required**: {len(over)} budget categories exceeded limits. Cap discretionary transactions in {over[0].category_name} immediately.")
                else:
                    lines.append("\n✅ All monitored categories are currently operating within their specified boundaries.")
            return "\n".join(lines)

        # Topic 4: Forecast / Future Cash Flow / 3 months
        if any(w in p for w in ["forecast", "future", "cash flow", "projection", "predict", "next month"]):
            return (
                f"### 📈 Cash-Flow Forecast (3-Month Rolling Average)\n\n"
                f"Based on your historical spending and income behavior:\n\n"
                f"- **Average Monthly Income**: {sym}{forecast.avg_monthly_income:,.2f}\n"
                f"- **Average Monthly Burn Rate**: {sym}{forecast.avg_monthly_expenses:,.2f}\n"
                f"- **Expected Monthly Surplus**: **{sym}{forecast.estimated_monthly_savings:,.2f}**\n"
                f"- **Projected 3-Month Accumulation**: **{sym}{forecast.three_month_savings_estimate:,.2f}**\n\n"
                f"**Trajectory Status**: `{forecast.trend_direction.upper()}`\n\n"
                f"💡 **Strategic Guidance**:\n"
                + "\n".join([f"- {r}" for r in forecast.recommendations])
            )

        # Topic 5: Financial Health Score / Rating
        if any(w in p for w in ["health", "score", "rating", "grade"]):
            lines = [
                f"### 🛡️ Financial Health Score: {health.overall_score}/100 ({health.rating})\n",
                f"{health.summary}\n",
                f"#### Factor Breakdown:"
            ]
            for ind in health.indicators:
                lines.append(f"- **{ind.name}** ({ind.weight}% weight): **{ind.score:.0f}/100** — {ind.actual_value}")
                lines.append(f"  *{ind.description}*")
            lines.append("\n#### Recommended Actions:")
            for tip in health.actionable_tips:
                lines.append(f"- {tip}")
            return "\n".join(lines)

        # Topic 6: Savings / Goals / How to save
        if any(w in p for w in ["save", "saving", "goal", "invest", "cut"]):
            lines = [
                f"### 💡 Personalized Savings Blueprint\n",
                f"You are currently saving **{sym}{summary.net_savings_this_month:,.2f}** ({summary.savings_rate_this_month}%) this month.\n",
                f"#### High-Impact Opportunities to Accelerate Savings:"
            ]
            if summary.category_breakdown:
                top = summary.category_breakdown[0]
                lines.append(f"1. **Audit Top Category ({top.name})**: Represents {top.percentage}% ({sym}{top.amount:,.0f}) of expenses. A 10% reduction frees up **{sym}{(top.amount * 0.1):,.0f}** monthly.")
            lines.append(f"2. **Automate Goal Allocations**: Channel your estimated monthly surplus of {sym}{forecast.estimated_monthly_savings:,.0f} into active goals.")
            if goals:
                lines.append(f"3. **Active Goals Tracking**: You have {len(goals)} active targets. Focus on completing `{goals[0].title}` ({sym}{goals[0].current_amount:,.0f}/{sym}{goals[0].target_amount:,.0f}).")
            return "\n".join(lines)

        # Default Intelligent Summary
        return (
            f"### 💡 FinPilot Financial Intelligence\n\n"
            f"I analyzed your active financial ledger:\n\n"
            f"- **Current Balance**: {sym}{summary.total_balance:,.2f}\n"
            f"- **Net Savings This Month**: {sym}{summary.net_savings_this_month:,.2f} ({summary.savings_rate_this_month}%)\n"
            f"- **Financial Health Score**: **{health.overall_score}/100** ({health.rating})\n"
            f"- **Projected 3-Month Savings**: **{sym}{forecast.three_month_savings_estimate:,.2f}**\n\n"
            f"Ask me anything specific like:\n"
            f"- *'How can I save {sym}5,000 this month?'*\n"
            f"- *'Explain my food and dining expenses'*\n"
            f"- *'What is my 3-month cash flow forecast?'*\n"
            f"- *'Am I on track with my budgets?'*"
        )
