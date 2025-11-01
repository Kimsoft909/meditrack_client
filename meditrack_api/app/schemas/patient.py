"""Patient schemas."""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


class PatientBase(BaseModel):
    """Base patient fields."""

    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date
    sex: str = Field(..., pattern="^(M|F|Other)$")
    blood_type: Optional[str] = Field(None, pattern="^(A|B|AB|O)[+-]?$")
    contact_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    weight: float = Field(..., gt=0, lt=500)
    height: float = Field(..., gt=0, lt=3.0)
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    notes: Optional[str] = None


class PatientCreate(PatientBase):
    """Create patient request."""

    pass


class PatientUpdate(BaseModel):
    """Update patient request (all fields optional)."""

    first_name: Optional[str] = None
    last_name: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    weight: Optional[float] = None
    height: Optional[float] = None
    allergies: Optional[str] = None
    chronic_conditions: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    risk_level: Optional[str] = None


class PatientResponse(PatientBase):
    """Patient response with computed fields."""

    id: str
    age: int
    bmi: float
    status: str
    risk_level: str
    admission_date: date
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PatientListResponse(BaseModel):
    """Paginated patient list response."""

    total: int
    page: int
    page_size: int
    patients: List[PatientResponse]
