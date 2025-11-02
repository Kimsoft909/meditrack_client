"""
Patient CRUD operations with pagination, search, and filtering.
"""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse
)
from app.services.patient_service import PatientService
from app.models.user import User


router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("", response_model=PatientListResponse)
async def get_patients(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get paginated patient list with optional filters.
    
    Filters:
    - search: Fuzzy search on name/ID
    - status: active, discharged, pending
    - risk_level: low, moderate, high, critical
    """
    service = PatientService(db)
    return await service.get_patients_paginated(
        page=page,
        page_size=page_size,
        search=search,
        status_filter=status,
        risk_filter=risk_level
    )


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create new patient record."""
    service = PatientService(db)
    return await service.create_patient(patient)


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get patient by ID with full details."""
    service = PatientService(db)
    return await service.get_patient_by_id(patient_id)


@router.patch("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    updates: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update patient information."""
    service = PatientService(db)
    return await service.update_patient(patient_id, updates)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete patient (set status to 'discharged')."""
    service = PatientService(db)
    await service.delete_patient(patient_id)
    return None
