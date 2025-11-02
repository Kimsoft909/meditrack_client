"""
Visit history schemas.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class VisitCreate(BaseModel):
    """Create visit request."""

    visit_type: str = Field(..., pattern="^(routine|emergency|follow-up)$")
    department: Optional[str] = None
    provider: Optional[str] = None
    chief_complaint: Optional[str] = None
    diagnosis: Optional[str] = None
    treatment: Optional[str] = None
    notes: Optional[str] = None


class VisitResponse(VisitCreate):
    """Visit response."""

    id: str
    patient_id: str
    visit_date: datetime

    model_config = {"from_attributes": True}


class VisitListResponse(BaseModel):
    """Paginated visit list response."""

    total: int
    page: int
    page_size: int
    visits: List[VisitResponse]
