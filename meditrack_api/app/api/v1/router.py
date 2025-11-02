"""Aggregates all v1 routers."""

from fastapi import APIRouter
from app.api.v1 import (
    auth,
    patients,
    vitals,
    medications,
    visits,
    ai_analysis,
    drug_checker,
    chat,
    dashboard,
    settings
)

api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router)
api_router.include_router(patients.router)
api_router.include_router(vitals.router)
api_router.include_router(medications.router)
api_router.include_router(visits.router)
api_router.include_router(ai_analysis.router)
api_router.include_router(drug_checker.router)
api_router.include_router(chat.router)
api_router.include_router(dashboard.router)
api_router.include_router(settings.router)
