from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.all_models import (
    User,
    Account,
    Category,
    Transaction,
    Budget,
    FinancialGoal,
    GoalContribution,
)

DEFAULT_SYSTEM_CATEGORIES = [
    # Income
    {"name": "Salary", "type": "income", "icon": "Briefcase", "color": "#10b981"},
    {"name": "Freelance & Consulting", "type": "income", "icon": "Laptop", "color": "#06b6d4"},
    {"name": "Investments & Dividends", "type": "income", "icon": "TrendingUp", "color": "#8b5cf6"},
    {"name": "Other Income", "type": "income", "icon": "PlusCircle", "color": "#3b82f6"},
    # Expenses
    {"name": "Rent & Housing", "type": "expense", "icon": "Home", "color": "#ef4444"},
    {"name": "Groceries", "type": "expense", "icon": "ShoppingCart", "color": "#f97316"},
    {"name": "Dining & Cafes", "type": "expense", "icon": "Utensils", "color": "#f59e0b"},
    {"name": "Utilities & Bills", "type": "expense", "icon": "Zap", "color": "#eab308"},
    {"name": "Transportation & Fuel", "type": "expense", "icon": "Car", "color": "#84cc16"},
    {"name": "Subscriptions & Software", "type": "expense", "icon": "Tv", "color": "#06b6d4"},
    {"name": "Shopping & Lifestyle", "type": "expense", "icon": "ShoppingBag", "color": "#ec4899"},
    {"name": "Health & Medical", "type": "expense", "icon": "HeartPulse", "color": "#14b8a6"},
    {"name": "Travel & Holidays", "type": "expense", "icon": "Plane", "color": "#a855f7"},
    {"name": "Debt Repayment & EMI", "type": "expense", "icon": "CreditCard", "color": "#dc2626"},
]

def seed_system_categories(db: Session):
    for cat_data in DEFAULT_SYSTEM_CATEGORIES:
        existing = db.query(Category).filter(
            Category.name == cat_data["name"],
            Category.is_system == True
        ).first()
        if not existing:
            cat = Category(
                name=cat_data["name"],
                type=cat_data["type"],
                icon=cat_data["icon"],
                color=cat_data["color"],
                is_system=True,
                user_id=None
            )
            db.add(cat)
    db.commit()

def seed_demo_user_data(db: Session) -> User:
    seed_system_categories(db)

    demo_email = "alex@finpilot.io"
    user = db.query(User).filter(User.email == demo_email).first()
    if user:
        return user

    # Create demo user
    user = User(
        email=demo_email,
        full_name="Alex Mercer",
        hashed_password=get_password_hash("password123"),
        currency="INR",
        is_admin=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Fetch system categories
    cats = {c.name: c for c in db.query(Category).filter(Category.is_system == True).all()}

    # Create Accounts
    acc_hdfc = Account(user_id=user.id, name="HDFC Salary Account", account_type="bank", balance=84500.0, currency="INR")
    acc_icici = Account(user_id=user.id, name="ICICI Mutual Fund & Equity", account_type="investment", balance=150000.0, currency="INR")
    acc_cash = Account(user_id=user.id, name="Physical Cash", account_type="cash", balance=6200.0, currency="INR")
    acc_card = Account(user_id=user.id, name="Axis Atlas Credit Card", account_type="credit_card", balance=-14500.0, currency="INR")
    
    db.add_all([acc_hdfc, acc_icici, acc_cash, acc_card])
    db.commit()

    # Goals
    now = datetime.utcnow()
    goal1 = FinancialGoal(
        user_id=user.id,
        title="Emergency Reserve (6 Months)",
        target_amount=250000.0,
        current_amount=180000.0,
        deadline=now + timedelta(days=120),
        category="Emergency Fund",
        status="active"
    )
    goal2 = FinancialGoal(
        user_id=user.id,
        title="MacBook Pro M3 Max",
        target_amount=199000.0,
        current_amount=135000.0,
        deadline=now + timedelta(days=60),
        category="Tech Gadgets",
        status="active"
    )
    goal3 = FinancialGoal(
        user_id=user.id,
        title="Japan Cherry Blossom Trip",
        target_amount=150000.0,
        current_amount=65000.0,
        deadline=now + timedelta(days=150),
        category="Travel",
        status="active"
    )
    db.add_all([goal1, goal2, goal3])
    db.commit()

    # Goal Contributions
    db.add(GoalContribution(goal_id=goal1.id, user_id=user.id, amount=25000.0, notes="Transferred from salary bonus", date=now - timedelta(days=12)))
    db.add(GoalContribution(goal_id=goal2.id, user_id=user.id, amount=15000.0, notes="Freelance project savings", date=now - timedelta(days=5)))
    db.commit()

    # Current Month Budgets
    curr_month = now.month
    curr_year = now.year

    b_dining = Budget(user_id=user.id, category_id=cats["Dining & Cafes"].id, amount=8000.0, month=curr_month, year=curr_year, alert_threshold=80.0)
    b_groc = Budget(user_id=user.id, category_id=cats["Groceries"].id, amount=10000.0, month=curr_month, year=curr_year, alert_threshold=80.0)
    b_shop = Budget(user_id=user.id, category_id=cats["Shopping & Lifestyle"].id, amount=5000.0, month=curr_month, year=curr_year, alert_threshold=80.0)
    b_subs = Budget(user_id=user.id, category_id=cats["Subscriptions & Software"].id, amount=3500.0, month=curr_month, year=curr_year, alert_threshold=80.0)
    b_util = Budget(user_id=user.id, category_id=cats["Utilities & Bills"].id, amount=6000.0, month=curr_month, year=curr_year, alert_threshold=80.0)

    db.add_all([b_dining, b_groc, b_shop, b_subs, b_util])
    db.commit()

    # Generate 3 months of Transactions (Current month, month - 1, month - 2)
    txs = []

    # Current month txs
    txs.extend([
        # Incomes
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Salary"].id, amount=95000.0, type="income", description="Monthly Tech Corp Salary", date=now.replace(day=1), payment_method="Net Banking"),
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Freelance & Consulting"].id, amount=18500.0, type="income", description="Fintech UI Design Consulting", date=now - timedelta(days=6), payment_method="UPI"),
        # Expenses (Current Month)
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Rent & Housing"].id, amount=26000.0, type="expense", description="Apartment Rent - November", date=now.replace(day=2), payment_method="Net Banking", is_recurring=True),
        Transaction(user_id=user.id, account_id=acc_card.id, category_id=cats["Groceries"].id, amount=9500.0, type="expense", description="Nature's Basket & Zepto groceries", date=now - timedelta(days=3), payment_method="Credit Card"),
        Transaction(user_id=user.id, account_id=acc_card.id, category_id=cats["Dining & Cafes"].id, amount=6400.0, type="expense", description="Dinner at Smoke House Deli & Blue Tokai", date=now - timedelta(days=4), payment_method="UPI"),
        Transaction(user_id=user.id, account_id=acc_card.id, category_id=cats["Shopping & Lifestyle"].id, amount=6800.0, type="expense", description="Uniqlo Winter Jacket & Zara Shoes", date=now - timedelta(days=5), payment_method="Credit Card"),
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Subscriptions & Software"].id, amount=2800.0, type="expense", description="ChatGPT Plus + Spotify Family + GitHub", date=now.replace(day=3), payment_method="Credit Card", is_recurring=True),
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Utilities & Bills"].id, amount=4200.0, type="expense", description="Fiber Internet & Electricity Bill", date=now - timedelta(days=7), payment_method="UPI", is_recurring=True),
        Transaction(user_id=user.id, account_id=acc_card.id, category_id=cats["Transportation & Fuel"].id, amount=3800.0, type="expense", description="Shell Petrol & Uber Commutes", date=now - timedelta(days=8), payment_method="UPI"),
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Debt Repayment & EMI"].id, amount=4500.0, type="expense", description="0% Interest Electronics EMI", date=now.replace(day=5), payment_method="Net Banking"),
    ])

    # Month - 1 txs
    m1_date = now - timedelta(days=32)
    txs.extend([
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Salary"].id, amount=95000.0, type="income", description="Monthly Tech Corp Salary", date=m1_date.replace(day=1), payment_method="Net Banking"),
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Freelance & Consulting"].id, amount=12000.0, type="income", description="Frontend Code Review", date=m1_date.replace(day=14), payment_method="UPI"),
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Rent & Housing"].id, amount=26000.0, type="expense", description="Apartment Rent", date=m1_date.replace(day=2), payment_method="Net Banking"),
        Transaction(user_id=user.id, account_id=acc_card.id, category_id=cats["Groceries"].id, amount=8900.0, type="expense", description="Instamart & Supermarket", date=m1_date.replace(day=9), payment_method="Credit Card"),
        Transaction(user_id=user.id, account_id=acc_card.id, category_id=cats["Dining & Cafes"].id, amount=5200.0, type="expense", description="Weekend Dining with friends", date=m1_date.replace(day=16), payment_method="UPI"),
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Subscriptions & Software"].id, amount=2800.0, type="expense", description="Software Subscriptions", date=m1_date.replace(day=3), payment_method="Credit Card"),
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Utilities & Bills"].id, amount=4100.0, type="expense", description="Electricity & Water", date=m1_date.replace(day=6), payment_method="UPI"),
        Transaction(user_id=user.id, account_id=acc_card.id, category_id=cats["Transportation & Fuel"].id, amount=4200.0, type="expense", description="Fuel & Cabs", date=m1_date.replace(day=20), payment_method="UPI"),
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Debt Repayment & EMI"].id, amount=4500.0, type="expense", description="EMI Repayment", date=m1_date.replace(day=5), payment_method="Net Banking"),
    ])

    # Month - 2 txs
    m2_date = now - timedelta(days=64)
    txs.extend([
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Salary"].id, amount=92000.0, type="income", description="Monthly Tech Corp Salary", date=m2_date.replace(day=1), payment_method="Net Banking"),
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Rent & Housing"].id, amount=26000.0, type="expense", description="Apartment Rent", date=m2_date.replace(day=2), payment_method="Net Banking"),
        Transaction(user_id=user.id, account_id=acc_card.id, category_id=cats["Groceries"].id, amount=8400.0, type="expense", description="Monthly Provisions & Supplies", date=m2_date.replace(day=8), payment_method="Credit Card"),
        Transaction(user_id=user.id, account_id=acc_card.id, category_id=cats["Dining & Cafes"].id, amount=4800.0, type="expense", description="Dining & Takeouts", date=m2_date.replace(day=15), payment_method="UPI"),
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Subscriptions & Software"].id, amount=2800.0, type="expense", description="Software Subscriptions", date=m2_date.replace(day=3), payment_method="Credit Card"),
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Utilities & Bills"].id, amount=3900.0, type="expense", description="Utility Invoices", date=m2_date.replace(day=7), payment_method="UPI"),
        Transaction(user_id=user.id, account_id=acc_card.id, category_id=cats["Transportation & Fuel"].id, amount=3900.0, type="expense", description="Commuting & Metro", date=m2_date.replace(day=18), payment_method="UPI"),
        Transaction(user_id=user.id, account_id=acc_hdfc.id, category_id=cats["Debt Repayment & EMI"].id, amount=4500.0, type="expense", description="EMI Repayment", date=m2_date.replace(day=5), payment_method="Net Banking"),
    ])

    db.add_all(txs)
    db.commit()

    return user
