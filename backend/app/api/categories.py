from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.all_models import Category, User
from app.schemas.all_schemas import CategoryCreate, CategoryResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/categories", tags=["Categories"])

@router.get("", response_model=List[CategoryResponse])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    categories = (
        db.query(Category)
        .filter(or_(Category.user_id == current_user.id, Category.is_system == True))
        .order_by(Category.name.asc())
        .all()
    )
    return [CategoryResponse.from_orm(c) for c in categories]

@router.post("", response_model=CategoryResponse)
def create_category(
    cat_in: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_cat = Category(
        user_id=current_user.id,
        name=cat_in.name,
        type=cat_in.type,
        icon=cat_in.icon or "Tag",
        color=cat_in.color or "#10b981",
        is_system=False
    )
    db.add(new_cat)
    db.commit()
    db.refresh(new_cat)
    return CategoryResponse.from_orm(new_cat)
