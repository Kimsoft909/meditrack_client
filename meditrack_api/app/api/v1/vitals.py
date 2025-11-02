"""
Vitals tracking endpoints.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.vital import (
    VitalReadingCreate,
    VitalResponse,
    VitalTrendResponse,
    VitalsChartResponse
)
from app.services.vital_service import VitalService
from app.models.user import User


router = APIRouter(prefix="/vitals", tags=["Vitals"])


@router.post("/patients/{patient_id}/vitals", response_model=VitalResponse, status_code=status.HTTP_201_CREATED)
async def create_vital_reading(
    patient_id: str,
    vital: VitalReadingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record new vital signs reading for a patient."""
    service = VitalService(db)
    return await service.create_vital(patient_id, vital)


@router.get("/patients/{patient_id}/vitals", response_model=List[VitalResponse])
async def get_patient_vitals(
    patient_id: str,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recent vital signs for a patient."""
    service = VitalService(db)
    return await service.get_patient_vitals(patient_id, limit)


@router.get("/patients/{patient_id}/vitals/trends", response_model=VitalTrendResponse)
async def get_vital_trends(
    patient_id: str,
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get vital signs trends with statistical analysis."""
    service = VitalService(db)
    return await service.get_trends(patient_id, days)


@router.get("/patients/{patient_id}/vitals/chart", response_model=VitalsChartResponse)
async def get_vitals_chart_data(
    patient_id: str,
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get vitals data formatted for charting."""
    service = VitalService(db)
    return await service.get_chart_data(patient_id, days)
