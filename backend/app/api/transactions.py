import csv
import io
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Response
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_db
from app.models.all_models import Transaction, Account, Category, User
from app.schemas.all_schemas import TransactionCreate, TransactionUpdate, TransactionResponse
from app.api.auth import get_current_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
def get_transactions(
    search: Optional[str] = None,
    type: Optional[str] = None,
    category_id: Optional[str] = None,
    account_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

    if type and type in ["income", "expense"]:
        query = query.filter(Transaction.type == type)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if account_id:
        query = query.filter(Transaction.account_id == account_id)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Transaction.description.ilike(search_filter),
                Transaction.tags.ilike(search_filter),
                Transaction.payment_method.ilike(search_filter)
            )
        )
    if start_date:
        try:
            dt_start = datetime.fromisoformat(start_date.replace("Z", ""))
            query = query.filter(Transaction.date >= dt_start)
        except Exception:
            pass
    if end_date:
        try:
            dt_end = datetime.fromisoformat(end_date.replace("Z", ""))
            query = query.filter(Transaction.date <= dt_end)
        except Exception:
            pass

    txs = query.order_by(Transaction.date.desc()).offset(offset).limit(limit).all()
    return [TransactionResponse.from_orm(t) for t in txs]

@router.post("", response_model=TransactionResponse)
def create_transaction(
    tx_in: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify account if provided
    account = None
    if tx_in.account_id:
        account = db.query(Account).filter(Account.id == tx_in.account_id, Account.user_id == current_user.id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")

    new_tx = Transaction(
        user_id=current_user.id,
        account_id=tx_in.account_id,
        category_id=tx_in.category_id,
        amount=tx_in.amount,
        type=tx_in.type,
        description=tx_in.description,
        date=tx_in.date or datetime.utcnow(),
        payment_method=tx_in.payment_method or "UPI",
        tags=tx_in.tags or "",
        is_recurring=tx_in.is_recurring or False
    )
    db.add(new_tx)

    # Update account balance
    if account:
        if tx_in.type == "income":
            account.balance += tx_in.amount
        elif tx_in.type == "expense":
            account.balance -= tx_in.amount

    db.commit()
    db.refresh(new_tx)
    return TransactionResponse.from_orm(new_tx)

@router.get("/{tx_id}", response_model=TransactionResponse)
def get_transaction(
    tx_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return TransactionResponse.from_orm(tx)

@router.put("/{tx_id}", response_model=TransactionResponse)
def update_transaction(
    tx_id: str,
    tx_update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Revert previous balance impact if amount/type changed
    account = tx.account
    if account and (tx_update.amount is not None or tx_update.type is not None):
        if tx.type == "income":
            account.balance -= tx.amount
        else:
            account.balance += tx.amount

    if tx_update.amount is not None:
        tx.amount = tx_update.amount
    if tx_update.type is not None:
        tx.type = tx_update.type
    if tx_update.description is not None:
        tx.description = tx_update.description
    if tx_update.category_id is not None:
        tx.category_id = tx_update.category_id
    if tx_update.account_id is not None:
        tx.account_id = tx_update.account_id
    if tx_update.date is not None:
        tx.date = tx_update.date
    if tx_update.payment_method is not None:
        tx.payment_method = tx_update.payment_method
    if tx_update.tags is not None:
        tx.tags = tx_update.tags
    if tx_update.is_recurring is not None:
        tx.is_recurring = tx_update.is_recurring

    # Apply new balance impact
    if account:
        if tx.type == "income":
            account.balance += tx.amount
        else:
            account.balance -= tx.amount

    db.commit()
    db.refresh(tx)
    return TransactionResponse.from_orm(tx)

@router.delete("/{tx_id}")
def delete_transaction(
    tx_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tx = db.query(Transaction).filter(Transaction.id == tx_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if tx.account:
        if tx.type == "income":
            tx.account.balance -= tx.amount
        else:
            tx.account.balance += tx.amount

    db.delete(tx)
    db.commit()
    return {"message": "Transaction deleted successfully", "id": tx_id}

@router.get("/export/csv")
def export_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    txs = db.query(Transaction).filter(Transaction.user_id == current_user.id).order_by(Transaction.date.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Transaction ID", "Date", "Description", "Type", "Amount", "Currency", "Category", "Account", "Payment Method", "Recurring"])

    for t in txs:
        cat_name = t.category.name if t.category else "Uncategorized"
        acc_name = t.account.name if t.account else "Default"
        writer.writerow([
            t.id,
            t.date.strftime("%Y-%m-%d %H:%M"),
            t.description,
            t.type.upper(),
            t.amount,
            current_user.currency,
            cat_name,
            acc_name,
            t.payment_method,
            "Yes" if t.is_recurring else "No"
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=finpilot_transactions_{datetime.utcnow().strftime('%Y%m%d')}.csv"}
    )

@router.post("/import/csv")
async def import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    content = await file.read()
    try:
        text_content = content.decode("utf-8")
    except UnicodeDecodeError:
        text_content = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text_content))
    created_count = 0
    categories = {c.name.lower(): c for c in db.query(Category).all()}
    accounts = {a.name.lower(): a for a in db.query(Account).filter(Account.user_id == current_user.id).all()}
    default_acc = list(accounts.values())[0] if accounts else None

    for row in reader:
        # Standardize keys
        row_keys = {k.strip().lower(): v.strip() for k, v in row.items() if k}
        amount_raw = row_keys.get("amount") or row_keys.get("value") or "0"
        try:
            amount = abs(float(amount_raw.replace(",", "").replace("₹", "").replace("$", "")))
        except ValueError:
            continue

        desc = row_keys.get("description") or row_keys.get("details") or row_keys.get("title") or "Imported Transaction"
        tx_type = row_keys.get("type", "expense").lower()
        if "credit" in tx_type or "income" in tx_type:
            tx_type = "income"
        else:
            tx_type = "expense"

        date_str = row_keys.get("date") or row_keys.get("transaction date")
        tx_date = datetime.utcnow()
        if date_str:
            for fmt in ("%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y", "%Y-%m-%d %H:%M"):
                try:
                    tx_date = datetime.strptime(date_str, fmt)
                    break
                except ValueError:
                    pass

        # Match category or smart categorize
        cat_str = (row_keys.get("category") or "").lower()
        matched_cat = categories.get(cat_str)
        if not matched_cat:
            # Smart rule matcher based on description keywords
            d_low = desc.lower()
            if any(k in d_low for k in ["salary", "payroll", "stipend"]):
                matched_cat = categories.get("salary")
            elif any(k in d_low for k in ["uber", "ola", "metro", "fuel", "petrol"]):
                matched_cat = categories.get("transportation & fuel")
            elif any(k in d_low for k in ["grocer", "supermarket", "zepto", "blinkit", "milk"]):
                matched_cat = categories.get("groceries")
            elif any(k in d_low for k in ["restaurant", "cafe", "swiggy", "zomato", "starbucks", "pizza"]):
                matched_cat = categories.get("dining & cafes")
            elif any(k in d_low for k in ["netflix", "spotify", "prime", "aws", "openai", "github"]):
                matched_cat = categories.get("subscriptions & software")
            elif any(k in d_low for k in ["rent", "landlord", "maintenance"]):
                matched_cat = categories.get("rent & housing")

        acc_str = (row_keys.get("account") or "").lower()
        matched_acc = accounts.get(acc_str) or default_acc

        tx = Transaction(
            user_id=current_user.id,
            account_id=matched_acc.id if matched_acc else None,
            category_id=matched_cat.id if matched_cat else None,
            amount=amount,
            type=tx_type,
            description=desc,
            date=tx_date,
            payment_method=row_keys.get("payment method", "UPI"),
            tags="csv-imported"
        )
        db.add(tx)
        created_count += 1

    db.commit()
    return {"message": f"Successfully imported {created_count} transactions", "imported_count": created_count}
