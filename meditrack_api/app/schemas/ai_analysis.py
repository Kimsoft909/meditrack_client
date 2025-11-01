"""AI analysis schemas."""

from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class AnalysisOptions(BaseModel):
    """Analysis configuration options."""

    include_vitals: bool = True
    include_medications: bool = True
    include_risk_assessment: bool = True
    include_comparative_analysis: bool = False


class AnalysisRequest(BaseModel):
    """Generate analysis report request."""

    patient_id: str
    date_range: Dict[str, str]  # {from: ISO date, to: ISO date}
    options: AnalysisOptions = Field(default_factory=AnalysisOptions)


class PatientSummary(BaseModel):
    """Patient summary for analysis."""

    id: str
    name: str
    age: int
    sex: str
    bmi: float
    risk_level: str


class AnalysisReportResponse(BaseModel):
    """Complete analysis report."""

    report_id: str
    patient: PatientSummary
    report_date: datetime
    analysis_date_range: Dict[str, str]
    generated_by: str
    executive_summary: str
    overall_health_score: Optional[int] = None
    sections: Dict[str, Any]
    metadata: Dict[str, Any]

    model_config = {"from_attributes": True}
