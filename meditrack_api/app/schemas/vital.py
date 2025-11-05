"""
Vital signs schemas with medical range validators.
Integrates physiological range validators for data integrity.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator

from app.utils.validators import validate_vital_ranges


class VitalReadingCreate(BaseModel):
    """Create vital reading request with medical validators."""

    blood_pressure_systolic: float
    blood_pressure_diastolic: float
    heart_rate: float
    temperature: float
    oxygen_saturation: float
    respiratory_rate: Optional[float] = None
    blood_glucose: Optional[float] = None
    notes: Optional[str] = None
    
    @field_validator('blood_pressure_systolic')
    @classmethod
    def validate_systolic(cls, v):
        """Validate systolic BP is physiologically plausible."""
        return validate_vital_ranges('blood_pressure_systolic', v)
    
    @field_validator('blood_pressure_diastolic')
    @classmethod
    def validate_diastolic(cls, v):
        """Validate diastolic BP is physiologically plausible."""
        return validate_vital_ranges('blood_pressure_diastolic', v)
    
    @field_validator('heart_rate')
    @classmethod
    def validate_hr(cls, v):
        """Validate heart rate is physiologically plausible."""
        return validate_vital_ranges('heart_rate', v)
    
    @field_validator('temperature')
    @classmethod
    def validate_temp(cls, v):
        """Validate temperature is physiologically plausible."""
        return validate_vital_ranges('temperature', v)
    
    @field_validator('oxygen_saturation')
    @classmethod
    def validate_o2(cls, v):
        """Validate oxygen saturation is physiologically plausible."""
        return validate_vital_ranges('oxygen_saturation', v)
    
    @field_validator('respiratory_rate')
    @classmethod
    def validate_rr(cls, v):
        """Validate respiratory rate if provided."""
        if v is not None:
            return validate_vital_ranges('respiratory_rate', v)
        return v
    
    @field_validator('blood_glucose')
    @classmethod
    def validate_glucose(cls, v):
        """Validate glucose level if provided."""
        if v is not None:
            return validate_vital_ranges('glucose_level', v)
        return v


class VitalResponse(VitalReadingCreate):
    """Vital reading response."""

    id: str
    patient_id: str
    timestamp: datetime
    recorded_by: Optional[str]

    model_config = {"from_attributes": True}


class VitalTrendPoint(BaseModel):
    """Single data point in trend analysis."""

    timestamp: datetime
    value: float
    status: str  # normal, warning, critical


class VitalTrendResponse(BaseModel):
    """Trend analysis for a specific vital parameter."""

    parameter: str
    unit: str
    current: float
    average: float
    trend: str  # increasing, decreasing, stable
    data_points: List[VitalTrendPoint]


class VitalsChartResponse(BaseModel):
    """Complete vitals chart data."""

    patient_id: str
    date_range: dict
    data: dict
