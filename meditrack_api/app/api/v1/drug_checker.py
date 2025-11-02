"""
Drug database search and interaction checking.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.drug_checker import (
    DrugSearchResponse,
    InteractionCheckRequest,
    InteractionResponse,
    FDADrugInfoResponse
)
from app.services.drug_service import DrugService
from app.services.interaction_service import InteractionService
from app.models.user import User


router = APIRouter(prefix="/drugs", tags=["Drug Checker"])


@router.get("/search", response_model=List[DrugSearchResponse])
async def search_drugs(
    q: str = Query(..., min_length=2),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fuzzy search drugs by name, generic name, or brand name."""
    service = DrugService(db)
    return await service.search_drugs(query=q, limit=limit)


@router.post("/check-interactions", response_model=List[InteractionResponse])
async def check_interactions(
    request: InteractionCheckRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check for drug-drug interactions."""
    service = InteractionService(db)
    return await service.check_interactions(request.drug_ids)


@router.get("/fda-info/{drug_id}", response_model=FDADrugInfoResponse)
async def get_fda_drug_info(
    drug_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed FDA drug information."""
    service = DrugService(db)
    return await service.get_fda_info(drug_id)
