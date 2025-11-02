"""
Medication schemas with domain validators.
Integrates medical dosage and date validators.
"""

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from app.utils.validators import validate_medication_dosage, validate_date_range


class MedicationCreate(BaseModel):
    """Create medication request with validators."""

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
    
    @field_validator('dosage')
    @classmethod
    def validate_dosage_format(cls, v):
        """Validate medication dosage format (e.g., 500mg, 10ml)."""
        return validate_medication_dosage(v)
    
    @field_validator('end_date')
    @classmethod
    def validate_date_order(cls, v, info):
        """Ensure end date is after start date if provided."""
        if v and 'start_date' in info.data:
            validate_date_range(info.data['start_date'], v)
        return v


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
