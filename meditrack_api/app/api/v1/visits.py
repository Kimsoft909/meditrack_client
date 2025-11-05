"""
Visit history endpoints.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.visit import VisitCreate, VisitResponse, VisitListResponse
from app.services.visit_service import VisitService
from app.models.user import User


router = APIRouter(prefix="/visits", tags=["Visits"])


@router.post("/patients/{patient_id}/visits", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
async def create_visit(
    patient_id: str,
    visit: VisitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a new patient visit."""
    service = VisitService(db)
    return await service.create_visit(patient_id, visit)


@router.get("/patients/{patient_id}/visits", response_model=VisitListResponse)
async def get_patient_visits(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get visit history for a patient."""
    service = VisitService(db)
    return await service.get_patient_visits(patient_id)
