from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token, oauth2_scheme
from app.models.all_models import User
from app.schemas.all_schemas import UserRegister, UserLogin, UserResponse, Token, UserUpdate
from app.services.seed_service import seed_demo_user_data

router = APIRouter(prefix="/auth", tags=["Authentication"])

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        # Default to demo user if no token provided in demo mode
        demo = db.query(User).filter(User.email == "alex@finpilot.io").first()
        if demo:
            return demo
        raise credentials_exception

    user_id = decode_token(token)
    if not user_id:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception
    return user

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    new_user = User(
        email=user_in.email.lower(),
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.password),
        currency=user_in.currency or "INR"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(new_user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.from_orm(new_user))

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.from_orm(user))

@router.post("/demo-login", response_model=Token)
def demo_login(db: Session = Depends(get_db)):
    user = seed_demo_user_data(db)
    token = create_access_token(user.id)
    return Token(access_token=token, token_type="bearer", user=UserResponse.from_orm(user))

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return UserResponse.from_orm(current_user)

@router.patch("/me", response_model=UserResponse)
def update_profile(
    user_update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.currency is not None:
        current_user.currency = user_update.currency
    db.commit()
    db.refresh(current_user)
    return UserResponse.from_orm(current_user)
