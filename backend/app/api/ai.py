from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all_models import User
from app.schemas.all_schemas import ChatRequest, ChatResponse
from app.services.ai_service import AiService
from app.api.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["FinPilot Intelligence"])

@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    chat_in: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return AiService.answer_query(db, current_user.id, chat_in.message, current_user.currency)
