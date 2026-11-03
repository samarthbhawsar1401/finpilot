from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all_models import User
from app.schemas.all_schemas import DashboardSummary
from app.services.analytics_service import AnalyticsService
from app.api.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Reports"])

@router.get("/dashboard", response_model=DashboardSummary)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AnalyticsService.get_dashboard_summary(db, current_user.id, current_user.currency)
