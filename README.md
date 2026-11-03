# FinPilot — AI Financial Intelligence

> **Tagline:** *Your money. Your intelligence. Your control.*

FinPilot is a premium, full-stack personal financial intelligence platform engineered with **Next.js 14**, **FastAPI**, **SQLAlchemy**, **Pandas**, **NumPy**, and **OpenAI**. Unlike traditional expense trackers that merely show where your money went, FinPilot combines statistical analysis, rolling-average cash flow forecasting, an explainable 5-pillar financial health score, and an intelligent financial copilot grounded strictly on your verified ledger.

---

## ⚡ Quick Start

### 1. Launch Everything with One Script (Windows)
Run PowerShell from the project root:
```powershell
.\start-all.ps1
```
Or start each service independently:
- **Backend:** `start-backend.bat` (Starts on `http://127.0.0.1:8000`)
- **Frontend:** `start-frontend.bat` (Starts on `http://localhost:3000`)

---

## 🔑 Demo Access Out-of-the-Box

The database pre-populates with rich demo records upon initial launch:
- **Demo User:** `alex@finpilot.io`
- **Password:** `password123`
- **Pre-seeded Ledgers:**
  - 4 Real-world Accounts: HDFC Salary, ICICI Investment Fund, Physical Cash, Axis Credit Card
  - 3 Months of Historical & Categorized Transactions (Salary, Groceries, Dining, Rent, Software Subscriptions, Fuel, EMIs)
  - Active Monthly Category Budgets with 80% Warning & Exceeded Thresholds
  - 3 Long-Term Financial Goals with Active Contributions (Emergency Fund, MacBook M3, Japan Trip)

---

## 🏗️ Architecture & Modules

```
finpilot/
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints (auth, transactions, budgets, goals, analytics, forecasting, health, ai, admin)
│   │   ├── core/            # Config, security (bcrypt & JWT), database session
│   │   ├── models/          # SQLAlchemy relational schema
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   ├── services/        # Analytics, 3-Month Rolling Average Forecasting, 5-Pillar Health Score, FinPilot Intelligence
│   │   └── main.py          # FastAPI application & lifespan seeder
│   ├── run.py               # Uvicorn entrypoint
│   └── requirements.txt     # Python dependencies
└── frontend/
    ├── src/
    │   ├── app/             # Next.js App Router (page.tsx, layout.tsx, globals.css)
    │   ├── components/      # Modular UI views (Dashboard, Transactions, Budgets, Goals, Analytics, Health, AI Drawer, Modals)
    │   └── lib/             # Typed API client, TypeScript definitions, currency formatters
    ├── package.json
    └── tailwind.config.ts
```

---

## 🧠 Core Features

### 1. Intelligent Financial Dashboard
- Total net worth, monthly income, monthly expenses, net savings, and savings rate.
- Month-over-Month percentage changes.
- Income vs. Expense 6-month historical trend charts (Recharts).
- Category distribution donut chart with percentage breakdown.
- Active monthly budget monitoring cards.
- Automated AI signals highlighting spending anomalies.

### 2. Transaction Management
- Comprehensive search across descriptions, tags, and payment methods.
- Multi-filtering by type (`income`/`expense`), category, and account.
- Add, Edit, and Delete transactions with real-time balance propagation.
- **CSV Import:** Drag-and-drop CSV parser with intelligent keyword-based auto-categorizer.
- **CSV Export:** Instant one-click transaction export.

### 3. Budget Management
- Monthly category spending caps.
- Dynamic color-coded utilization meters:
  - 🟢 **Healthy** (<80%)
  - 🟡 **Warning Alert** (80% – 100%)
  - 🔴 **Exceeded** (>100%)
- Budget adherence summary and overruns alert banner.

### 4. Financial Goals and Savings
- Define targets with designated categories and target deadlines.
- Track remaining amount and percentage completion.
- Interactive "Add Funds" modal to log goal contributions.

### 5. Cash-Flow Forecasting (3-Month Rolling Baseline)
- Rolling average income and expense baseline calculated via Pandas.
- Project expected monthly savings, 3-month surplus, and 6-month projections.
- Timeline visualization showing historical vs. projected future months.
- Cash-flow deficit risk alerts and automated recommendations.

### 6. Explainable Financial Health Score (0 - 100)
Calculated from the exact 5 weighted indicators:
1. **Savings Rate (30% weight)**: Compares actual net savings against 20%+ benchmark standards.
2. **Budget Adherence (25% weight)**: Rates compliance across all active category caps.
3. **Expense Consistency (20% weight)**: Coefficient of variation across multi-cycle expenses.
4. **Emergency Fund Progress (15% weight)**: Evaluates liquid buffer against monthly burn rate.
5. **Debt Obligations (10% weight)**: Debt-to-income (DTI) ratio tracking.
*Scores explain how they were calculated and flag missing data as "unavailable" rather than guessing.*

### 7. FinPilot Intelligence (AI Assistant)
- Ask questions directly about your verified financial records.
- Examples:
  - *"Where did I spend the most this month?"*
  - *"How can I save ₹5,000 this month?"*
  - *"Explain my food and dining expenses"*
  - *"Forecast my cash flow for next quarter"*
- Powered by OpenAI GPT-4o-mini if `OPENAI_API_KEY` is provided, or the built-in deterministic financial NLP engine (guarantees zero hallucination and 100% offline availability).

### 8. Platform Telemetry & Administration
- System operational health monitor.
- Monitored user count, ledger transactions, AI query telemetry, and uptime.

---

## 🛠️ Configuration & Secrets

In `backend/.env`:
```ini
PROJECT_NAME="FinPilot — AI Financial Intelligence"
DATABASE_URL="sqlite:///./finpilot.db"
# Or PostgreSQL/Supabase:
# DATABASE_URL="postgresql://postgres:[password]@db.supabase.co:5432/postgres"

SECRET_KEY="your-production-secret-key"

# Optional: Add OpenAI API key to enable GPT-4o-mini financial intelligence
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4o-mini"
```

---

## 🌐 Production Deployment

- **Frontend:** Connect GitHub repo to [Vercel](https://vercel.com), set root directory to `frontend`, and configure `NEXT_PUBLIC_API_URL` pointing to your deployed backend.
- **Backend:** Deploy `backend` to [Render](https://render.com) or [Railway](https://railway.app) using `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Database:** Connect to hosted [Supabase](https://supabase.com) PostgreSQL by updating `DATABASE_URL`.
