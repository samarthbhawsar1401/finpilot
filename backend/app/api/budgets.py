from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all_models import Budget, Category, Transaction, User
from app.schemas.all_schemas import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetStatusResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=List[BudgetStatusResponse])
def get_budgets(
    month: int = None,
    year: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.utcnow()
    m = month or now.month
    y = year or now.year

    budgets = (
        db.query(Budget)
        .filter(Budget.user_id == current_user.id, Budget.month == m, Budget.year == y)
        .all()
    )

    result = []
    for b in budgets:
        # Calculate actual spend for this category in this month & year
        spent = (
            db.query(Transaction)
            .filter(
                Transaction.user_id == current_user.id,
                Transaction.category_id == b.category_id,
                Transaction.type == "expense"
            )
            .all()
        )
        cat_spent = sum(t.amount for t in spent if t.date.month == m and t.date.year == y)
        utilization = (cat_spent / b.amount * 100) if b.amount > 0 else 0.0

        cat_name = b.category.name if b.category else "Custom Category"
        cat_color = b.category.color if b.category else "#6366f1"
        cat_icon = b.category.icon if b.category else "Wallet"

        result.append(
            BudgetStatusResponse(
                id=b.id,
                category_id=b.category_id,
                category_name=cat_name,
                category_color=cat_color,
                category_icon=cat_icon,
                budgeted_amount=round(b.amount, 2),
                spent_amount=round(cat_spent, 2),
                remaining_amount=round(max(0.0, b.amount - cat_spent), 2),
                utilization_percentage=round(utilization, 1),
                is_warning=utilization >= b.alert_threshold and utilization <= 100,
                is_exceeded=utilization > 100,
                month=b.month,
                year=b.year
            )
        )
    return result

@router.post("", response_model=BudgetResponse)
def create_budget(
    b_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    category = db.query(Category).filter(Category.id == b_in.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    existing = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.category_id == b_in.category_id,
            Budget.month == b_in.month,
            Budget.year == b_in.year
        )
        .first()
    )
    if existing:
        existing.amount = b_in.amount
        existing.alert_threshold = b_in.alert_threshold or 80.0
        db.commit()
        db.refresh(existing)
        return BudgetResponse.from_orm(existing)

    new_b = Budget(
        user_id=current_user.id,
        category_id=b_in.category_id,
        amount=b_in.amount,
        period=b_in.period or "monthly",
        month=b_in.month,
        year=b_in.year,
        alert_threshold=b_in.alert_threshold or 80.0
    )
    db.add(new_b)
    db.commit()
    db.refresh(new_b)
    return BudgetResponse.from_orm(new_b)

@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: str,
    b_update: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")
    if b_update.amount is not None:
        b.amount = b_update.amount
    if b_update.alert_threshold is not None:
        b.alert_threshold = b_update.alert_threshold
    db.commit()
    db.refresh(b)
    return BudgetResponse.from_orm(b)

@router.delete("/{budget_id}")
def delete_budget(
    budget_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Budget not found")
    db.delete(b)
    db.commit()
    return {"message": "Budget deleted successfully", "id": budget_id}
