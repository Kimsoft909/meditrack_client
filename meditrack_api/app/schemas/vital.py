"""Vital signs schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class VitalReadingCreate(BaseModel):
    """Create vital reading request."""

    blood_pressure_systolic: float = Field(..., ge=50, le=250)
    blood_pressure_diastolic: float = Field(..., ge=30, le=150)
    heart_rate: float = Field(..., ge=30, le=250)
    temperature: float = Field(..., ge=30.0, le=45.0)
    oxygen_saturation: float = Field(..., ge=0, le=100)
    respiratory_rate: Optional[float] = Field(None, ge=5, le=60)
    blood_glucose: Optional[float] = Field(None, ge=20, le=600)
    notes: Optional[str] = None


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
    vitals: List[VitalResponse]
    trends: List[VitalTrendResponse]
