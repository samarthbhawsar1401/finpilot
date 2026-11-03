from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all_models import FinancialGoal, GoalContribution, User
from app.schemas.all_schemas import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    GoalContributionCreate,
    GoalContributionResponse
)
from app.api.auth import get_current_user

router = APIRouter(prefix="/goals", tags=["Financial Goals"])

def format_goal_response(g: FinancialGoal) -> GoalResponse:
    pct = (g.current_amount / g.target_amount * 100) if g.target_amount > 0 else 0.0
    rem = max(0.0, g.target_amount - g.current_amount)
    contributions = [GoalContributionResponse.from_orm(c) for c in g.contributions]
    return GoalResponse(
        id=g.id,
        user_id=g.user_id,
        title=g.title,
        target_amount=round(g.target_amount, 2),
        current_amount=round(g.current_amount, 2),
        deadline=g.deadline,
        category=g.category,
        status=g.status,
        created_at=g.created_at,
        progress_percentage=round(min(100.0, pct), 1),
        remaining_amount=round(rem, 2),
        contributions=contributions
    )

@router.get("", response_model=List[GoalResponse])
def get_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == current_user.id).order_by(FinancialGoal.created_at.desc()).all()
    return [format_goal_response(g) for g in goals]

@router.post("", response_model=GoalResponse)
def create_goal(
    goal_in: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_g = FinancialGoal(
        user_id=current_user.id,
        title=goal_in.title,
        target_amount=goal_in.target_amount,
        current_amount=goal_in.current_amount or 0.0,
        deadline=goal_in.deadline,
        category=goal_in.category or "Savings",
        status="active"
    )
    db.add(new_g)
    db.commit()
    db.refresh(new_g)
    return format_goal_response(new_g)

@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: str,
    goal_update: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    g = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id, FinancialGoal.user_id == current_user.id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")

    if goal_update.title is not None:
        g.title = goal_update.title
    if goal_update.target_amount is not None:
        g.target_amount = goal_update.target_amount
    if goal_update.current_amount is not None:
        g.current_amount = goal_update.current_amount
    if goal_update.deadline is not None:
        g.deadline = goal_update.deadline
    if goal_update.category is not None:
        g.category = goal_update.category
    if goal_update.status is not None:
        g.status = goal_update.status

    db.commit()
    db.refresh(g)
    return format_goal_response(g)

@router.delete("/{goal_id}")
def delete_goal(
    goal_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    g = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id, FinancialGoal.user_id == current_user.id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(g)
    db.commit()
    return {"message": "Goal deleted successfully", "id": goal_id}

@router.post("/{goal_id}/contribute", response_model=GoalResponse)
def contribute_to_goal(
    goal_id: str,
    contrib: GoalContributionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    g = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id, FinancialGoal.user_id == current_user.id).first()
    if not g:
        raise HTTPException(status_code=404, detail="Goal not found")

    contribution = GoalContribution(
        goal_id=g.id,
        user_id=current_user.id,
        amount=contrib.amount,
        notes=contrib.notes or "",
        date=contrib.date or datetime.utcnow()
    )
    db.add(contribution)
    g.current_amount += contrib.amount
    if g.current_amount >= g.target_amount:
        g.status = "completed"

    db.commit()
    db.refresh(g)
    return format_goal_response(g)
