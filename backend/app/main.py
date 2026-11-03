import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.services.seed_service import seed_demo_user_data, seed_system_categories

from app.api.auth import router as auth_router
from app.api.transactions import router as tx_router
from app.api.accounts import router as acc_router
from app.api.categories import router as cat_router
from app.api.budgets import router as budget_router
from app.api.goals import router as goal_router
from app.api.analytics import router as analytics_router
from app.api.forecasting import router as forecasting_router
from app.api.health_score import router as health_router
from app.api.ai import router as ai_router
from app.api.admin import router as admin_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite/PostgreSQL tables
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed initial demo user and default categories
    db = SessionLocal()
    try:
        seed_system_categories(db)
        seed_demo_user_data(db)
    finally:
        db.close()
    
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="FinPilot AI Financial Intelligence API — Next-Gen Personal Finance SaaS",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
routers = [
    auth_router,
    tx_router,
    acc_router,
    cat_router,
    budget_router,
    goal_router,
    analytics_router,
    forecasting_router,
    health_router,
    ai_router,
    admin_router,
]

for r in routers:
    app.include_router(r, prefix=settings.API_V1_STR)
    app.include_router(r, prefix="/api")

@app.get("/")
def root():
    return {
        "app": "FinPilot — AI Financial Intelligence",
        "tagline": "Your money. Your intelligence. Your control.",
        "status": "operational",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "finpilot-backend"}
