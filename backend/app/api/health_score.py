from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all_models import User
from app.schemas.all_schemas import FinancialHealthScore
from app.services.health_score_service import HealthScoreService
from app.api.auth import get_current_user

router = APIRouter(prefix="/health-score", tags=["Financial Health Score"])

@router.get("", response_model=FinancialHealthScore)
def get_health_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return HealthScoreService.calculate_health_score(db, current_user.id, current_user.currency)
