from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.all_models import Account, User
from app.schemas.all_schemas import AccountCreate, AccountUpdate, AccountResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/accounts", tags=["Accounts"])

@router.get("", response_model=List[AccountResponse])
def get_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    accounts = db.query(Account).filter(Account.user_id == current_user.id).order_by(Account.created_at.desc()).all()
    return [AccountResponse.from_orm(a) for a in accounts]

@router.post("", response_model=AccountResponse)
def create_account(
    acc_in: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_acc = Account(
        user_id=current_user.id,
        name=acc_in.name,
        account_type=acc_in.account_type,
        balance=acc_in.balance,
        currency=acc_in.currency or current_user.currency
    )
    db.add(new_acc)
    db.commit()
    db.refresh(new_acc)
    return AccountResponse.from_orm(new_acc)

@router.put("/{acc_id}", response_model=AccountResponse)
def update_account(
    acc_id: str,
    acc_update: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    acc = db.query(Account).filter(Account.id == acc_id, Account.user_id == current_user.id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")

    if acc_update.name is not None:
        acc.name = acc_update.name
    if acc_update.account_type is not None:
        acc.account_type = acc_update.account_type
    if acc_update.balance is not None:
        acc.balance = acc_update.balance
    if acc_update.currency is not None:
        acc.currency = acc_update.currency
    if acc_update.is_active is not None:
        acc.is_active = acc_update.is_active

    db.commit()
    db.refresh(acc)
    return AccountResponse.from_orm(acc)

@router.delete("/{acc_id}")
def delete_account(
    acc_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    acc = db.query(Account).filter(Account.id == acc_id, Account.user_id == current_user.id).first()
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(acc)
    db.commit()
    return {"message": "Account deleted successfully", "id": acc_id}
