"""Dashboard schemas."""

from typing import Dict, List

from pydantic import BaseModel


class KPIMetric(BaseModel):
    """Single KPI metric."""

    label: str
    value: int | float
    trend: float  # % change
    trend_direction: str  # up, down, stable


class DashboardStatsResponse(BaseModel):
    """Dashboard statistics."""

    total_patients: int
    active_patients: int
    discharged_patients: int
    critical_alerts: int
    pending_analyses: int


class KPIMetricsResponse(BaseModel):
    """KPI metrics response."""

    metrics: List[KPIMetric]


class RiskDistributionResponse(BaseModel):
    """Risk distribution data."""

    distribution: Dict[str, int]  # {risk_level: count}


class SparklineData(BaseModel):
    """Sparkline data for vitals."""

    label: str
    data: List[float]
    unit: str


class VitalsTrendsResponse(BaseModel):
    """Aggregated vitals trends."""

    sparklines: List[SparklineData]
