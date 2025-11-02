"""
Dashboard KPIs and data aggregation.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.dashboard import (
    DashboardStatsResponse,
    KPIMetricsResponse,
    RiskDistributionResponse,
    VitalsTrendsResponse
)
from app.services.dashboard_service import DashboardService
from app.models.user import User


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive dashboard statistics."""
    service = DashboardService(db)
    return await service.get_dashboard_stats()


@router.get("/kpis", response_model=KPIMetricsResponse)
async def get_kpi_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get KPI metrics with trend indicators."""
    service = DashboardService(db)
    return await service.calculate_kpis()


@router.get("/risk-distribution", response_model=RiskDistributionResponse)
async def get_risk_distribution(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get patient distribution by risk level."""
    service = DashboardService(db)
    return await service.get_risk_distribution()


@router.get("/vitals-trends", response_model=VitalsTrendsResponse)
async def get_vitals_trends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get aggregated vitals trends across all patients."""
    service = DashboardService(db)
    return await service.get_vitals_trends()
