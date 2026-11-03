from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np

from app.models.all_models import Transaction
from app.schemas.all_schemas import CashFlowForecast

class ForecastingService:
    @staticmethod
    def calculate_forecast(db: Session, user_id: str, currency: str = "INR") -> CashFlowForecast:
        now = datetime.utcnow()
        sym = "₹" if currency == "INR" else ("$" if currency == "USD" else "€")

        # Fetch all transactions
        transactions = (
            db.query(Transaction)
            .filter(Transaction.user_id == user_id)
            .order_by(Transaction.date.asc())
            .all()
        )

        if not transactions:
            return CashFlowForecast(
                avg_monthly_income=0.0,
                avg_monthly_expenses=0.0,
                estimated_monthly_savings=0.0,
                three_month_savings_estimate=0.0,
                six_month_savings_estimate=0.0,
                historical_months_analyzed=0,
                trend_direction="neutral",
                forecast_chart_data=[],
                recommendations=["Start logging your income and expenses to unlock predictive cash flow forecasts."]
            )

        # Build monthly dataframe
        records = []
        for tx in transactions:
            records.append({
                "date": tx.date,
                "year_month": f"{tx.date.year}-{tx.date.month:02d}",
                "type": tx.type,
                "amount": tx.amount
            })

        df = pd.DataFrame(records)

        # Pivot to get monthly income and expense
        monthly_summary = df.pivot_table(
            index="year_month",
            columns="type",
            values="amount",
            aggfunc="sum",
            fill_value=0.0
        ).reset_index()

        if "income" not in monthly_summary.columns:
            monthly_summary["income"] = 0.0
        if "expense" not in monthly_summary.columns:
            monthly_summary["expense"] = 0.0

        monthly_summary["savings"] = monthly_summary["income"] - monthly_summary["expense"]
        
        # Take up to the last 3 completed or active months for rolling baseline
        rolling_df = monthly_summary.tail(3)
        historical_months_analyzed = len(rolling_df)

        avg_income = float(rolling_df["income"].mean()) if not rolling_df.empty else 0.0
        avg_expense = float(rolling_df["expense"].mean()) if not rolling_df.empty else 0.0
        est_monthly_savings = avg_income - avg_expense
        three_month_savings = est_monthly_savings * 3.0
        six_month_savings = est_monthly_savings * 6.0

        # Trend direction
        if est_monthly_savings > 5000:
            trend_direction = "surplus"
        elif est_monthly_savings >= 0:
            trend_direction = "neutral"
        else:
            trend_direction = "deficit_risk"

        # Construct projection timeline for visualization (historical months + 3 projected future months)
        forecast_chart_data = []

        # Add historical points
        for _, row in monthly_summary.tail(5).iterrows():
            ym_parts = row["year_month"].split("-")
            label_dt = datetime(int(ym_parts[0]), int(ym_parts[1]), 1)
            forecast_chart_data.append({
                "period": label_dt.strftime("%b %Y"),
                "is_projected": False,
                "income": round(float(row["income"]), 2),
                "expenses": round(float(row["expense"]), 2),
                "net_savings": round(float(row["savings"]), 2)
            })

        # Add next 3 projected months
        last_dt = now
        for i in range(1, 4):
            # approximate month additions
            future_dt = last_dt + timedelta(days=30.5 * i)
            # slight trend adjustment based on rolling standard deviation
            forecast_chart_data.append({
                "period": f"{future_dt.strftime('%b %Y')} (Forecast)",
                "is_projected": True,
                "income": round(avg_income, 2),
                "expenses": round(avg_expense, 2),
                "net_savings": round(est_monthly_savings, 2)
            })

        # Generate intelligent recommendations
        recommendations = []
        if trend_direction == "deficit_risk":
            recommendations.append(
                f"Urgent: Projected expenses ({sym}{avg_expense:,.0f}) exceed income ({sym}{avg_income:,.0f}) by {sym}{abs(est_monthly_savings):,.0f}/mo. Identify variable expenses to freeze immediately."
            )
            recommendations.append("Pause non-critical goal contributions until cash-flow stabilizes above zero.")
        elif est_monthly_savings < 3000:
            recommendations.append(
                f"Your cash cushion is narrow ({sym}{est_monthly_savings:,.0f}/mo). Build an emergency buffer before major discretionary purchases."
            )
        else:
            recommendations.append(
                f"Consistent surplus detected: On current pace, you are on track to accumulate {sym}{three_month_savings:,.0f} in surplus over the next quarter."
            )
            recommendations.append("Consider auto-routing 40% of this surplus into high-yield deposits or active savings goals.")

        if avg_expense > 0:
            expense_ratio = (avg_expense / avg_income * 100) if avg_income > 0 else 100
            recommendations.append(f"Fixed & variable burn rate represents {expense_ratio:.1f}% of your rolling income base.")

        return CashFlowForecast(
            avg_monthly_income=round(avg_income, 2),
            avg_monthly_expenses=round(avg_expense, 2),
            estimated_monthly_savings=round(est_monthly_savings, 2),
            three_month_savings_estimate=round(three_month_savings, 2),
            six_month_savings_estimate=round(six_month_savings, 2),
            historical_months_analyzed=historical_months_analyzed,
            trend_direction=trend_direction,
            forecast_chart_data=forecast_chart_data,
            recommendations=recommendations
        )
