from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all_models import User
from app.schemas.all_schemas import CashFlowForecast
from app.services.forecasting_service import ForecastingService
from app.api.auth import get_current_user

router = APIRouter(prefix="/forecasting", tags=["Cash-Flow Forecasting"])

@router.get("", response_model=CashFlowForecast)
def get_cash_flow_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ForecastingService.calculate_forecast(db, current_user.id, current_user.currency)
