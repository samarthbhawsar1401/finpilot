import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Boolean, Integer, Text, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    currency = Column(String(10), default="INR")  # 'INR' (₹), 'USD' ($), 'EUR' (€), etc.
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
    categories = relationship("Category", back_populates="user", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    goals = relationship("FinancialGoal", back_populates="user", cascade="all, delete-orphan")
    ai_logs = relationship("AiInteraction", back_populates="user", cascade="all, delete-orphan")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)  # e.g., "HDFC Salary Account", "Main Cash", "ICICI Credit Card"
    account_type = Column(String(50), default="bank")  # 'bank', 'cash', 'credit_card', 'investment', 'savings'
    balance = Column(Float, default=0.0)
    currency = Column(String(10), default="INR")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")


class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=True, index=True)  # Nullable for system categories
    name = Column(String(100), nullable=False)
    type = Column(String(20), nullable=False)  # 'income' or 'expense'
    icon = Column(String(50), default="Tag")
    color = Column(String(20), default="#10b981")
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="categories")
    transactions = relationship("Transaction", back_populates="category")
    budgets = relationship("Budget", back_populates="category")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    account_id = Column(String(36), ForeignKey("accounts.id", ondelete="SET NULL"), nullable=True, index=True)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True)
    amount = Column(Float, nullable=False)
    type = Column(String(20), nullable=False)  # 'income' or 'expense'
    description = Column(String(255), nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    payment_method = Column(String(50), default="UPI")  # 'UPI', 'Net Banking', 'Debit Card', 'Credit Card', 'Cash'
    tags = Column(String(255), default="")  # comma-separated tags
    is_recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")
    account = relationship("Account", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)  # Budget limit
    period = Column(String(20), default="monthly")  # 'monthly', 'weekly'
    month = Column(Integer, nullable=False)  # 1-12
    year = Column(Integer, nullable=False)
    alert_threshold = Column(Float, default=80.0)  # Alert when 80% is reached
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="budgets")
    category = relationship("Category", back_populates="budgets")


class FinancialGoal(Base):
    __tablename__ = "financial_goals"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(150), nullable=False)  # e.g. "Emergency Fund 6 Months", "New MacBook M3", "Stock Portfolio"
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    deadline = Column(DateTime, nullable=True)
    category = Column(String(50), default="Savings")
    status = Column(String(20), default="active")  # 'active', 'completed', 'paused'
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="goals")
    contributions = relationship("GoalContribution", back_populates="goal", cascade="all, delete-orphan")


class GoalContribution(Base):
    __tablename__ = "goal_contributions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    goal_id = Column(String(36), ForeignKey("financial_goals.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    notes = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    goal = relationship("FinancialGoal", back_populates="contributions")


class AiInteraction(Base):
    __tablename__ = "ai_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    tokens_used = Column(Integer, default=0)
    model = Column(String(50), default="finpilot-engine")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="ai_logs")
