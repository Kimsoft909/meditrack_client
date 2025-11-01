"""Medication schemas."""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field


class MedicationCreate(BaseModel):
    """Create medication request."""

    name: str = Field(..., min_length=1, max_length=200)
    dosage: str = Field(..., min_length=1, max_length=100)
    frequency: str = Field(..., min_length=1, max_length=100)
    route: Optional[str] = None
    prescribed_by: Optional[str] = None
    start_date: date = Field(default_factory=date.today)
    end_date: Optional[date] = None
    indication: Optional[str] = None
    notes: Optional[str] = None
    drug_id: Optional[str] = None


class MedicationUpdate(BaseModel):
    """Update medication request."""

    dosage: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class MedicationResponse(MedicationCreate):
    """Medication response."""

    id: str
    patient_id: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
