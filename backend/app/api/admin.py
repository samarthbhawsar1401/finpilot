import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all_models import User, Transaction, Account, Budget, FinancialGoal, AiInteraction
from app.schemas.all_schemas import AdminStatsResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["Administration & Monitoring"])

# Start timestamp for uptime
START_TIME = time.time()

@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_users = db.query(User).count()
    total_txs = db.query(Transaction).count()
    total_accs = db.query(Account).count()
    total_budgets = db.query(Budget).count()
    total_goals = db.query(FinancialGoal).count()
    total_ai = db.query(AiInteraction).count()

    uptime_days = (time.time() - START_TIME) / (24 * 3600)

    return AdminStatsResponse(
        total_users=total_users,
        total_transactions=total_txs,
        total_accounts=total_accs,
        total_budgets=total_budgets,
        total_goals=total_goals,
        total_ai_queries=total_ai,
        platform_uptime_days=round(max(0.01, uptime_days), 2),
        system_status="HEALTHY · ALL SYSTEMS OPERATIONAL"
    )
