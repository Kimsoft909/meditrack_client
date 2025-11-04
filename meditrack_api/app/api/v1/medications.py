"""
Medication management endpoints.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.medication import (
    MedicationCreate,
    MedicationUpdate,
    MedicationResponse,
    MedicationListResponse
)
from app.services.medication_service import MedicationService
from app.models.user import User


router = APIRouter(prefix="/medications", tags=["Medications"])


@router.post("/patients/{patient_id}/medications", response_model=MedicationResponse, status_code=status.HTTP_201_CREATED)
async def create_medication(
    patient_id: str,
    medication: MedicationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add new medication to patient's regimen."""
    service = MedicationService(db)
    return await service.create_medication(patient_id, medication)


@router.get("/patients/{patient_id}/medications", response_model=MedicationListResponse)
async def get_patient_medications(
    patient_id: str,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all medications for a patient."""
    service = MedicationService(db)
    return await service.get_patient_medications(patient_id, active_only)


@router.patch("/{medication_id}", response_model=MedicationResponse)
async def update_medication(
    medication_id: str,
    updates: MedicationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update medication details."""
    service = MedicationService(db)
    return await service.update_medication(medication_id, updates)


@router.delete("/{medication_id}", status_code=status.HTTP_204_NO_CONTENT)
async def discontinue_medication(
    medication_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Discontinue a medication (soft delete)."""
    service = MedicationService(db)
    await service.discontinue_medication(medication_id)
    return None
