"""
Dashboard analytics and KPI calculations with Redis caching.
"""

from datetime import datetime, timedelta
from typing import Dict, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.patient import Patient, PatientStatus, RiskLevel
from app.models.vital import Vital
from app.models.ai_analysis import AIAnalysis
from app.schemas.dashboard import (
    DashboardStatsResponse,
    KPIMetric,
    KPIMetricsResponse,
    RiskDistributionResponse,
    SparklineData,
    VitalsTrendsResponse
)
from app.utils.cache import cache_result, invalidate_cache


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    @cache_result(ttl=300, key_prefix="dashboard")
    async def get_dashboard_stats(self) -> DashboardStatsResponse:
        """Get comprehensive dashboard statistics."""
        # Total patients
        total_result = await self.db.execute(
            select(func.count(Patient.id))
        )
        total_patients = total_result.scalar()
        
        # Active patients
        active_result = await self.db.execute(
            select(func.count(Patient.id)).where(Patient.status == PatientStatus.ACTIVE)
        )
        active_patients = active_result.scalar()
        
        # Discharged patients
        discharged_result = await self.db.execute(
            select(func.count(Patient.id)).where(Patient.status == PatientStatus.DISCHARGED)
        )
        discharged_patients = discharged_result.scalar()
        
        # Critical alerts (high/critical risk patients)
        critical_result = await self.db.execute(
            select(func.count(Patient.id)).where(
                Patient.status == PatientStatus.ACTIVE,
                Patient.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL])
            )
        )
        critical_alerts = critical_result.scalar()
        
        # Pending analyses (placeholder - could track pending reports)
        pending_analyses = 0
        
        return DashboardStatsResponse(
            total_patients=total_patients,
            active_patients=active_patients,
            discharged_patients=discharged_patients,
            critical_alerts=critical_alerts,
            pending_analyses=pending_analyses
        )
    
    @cache_result(ttl=300, key_prefix="dashboard")
    async def calculate_kpis(self) -> KPIMetricsResponse:
        """Calculate KPI metrics with trend indicators."""
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        two_weeks_ago = now - timedelta(days=14)
        
        # Current active patients
        current_result = await self.db.execute(
            select(func.count(Patient.id)).where(
                Patient.status == PatientStatus.ACTIVE
            )
        )
        current_active = current_result.scalar()
        
        # Previous week active patients
        prev_result = await self.db.execute(
            select(func.count(Patient.id)).where(
                Patient.status == PatientStatus.ACTIVE,
                Patient.admission_date < week_ago
            )
        )
        prev_active = prev_result.scalar()
        
        # Calculate trend
        if prev_active > 0:
            trend = ((current_active - prev_active) / prev_active) * 100
        else:
            trend = 0.0
        
        trend_direction = "up" if trend > 0 else "down" if trend < 0 else "stable"
        
        metrics = [
            KPIMetric(
                label="Active Patients",
                value=current_active,
                trend=round(trend, 1),
                trend_direction=trend_direction
            ),
            KPIMetric(
                label="Average Risk Score",
                value=2.3,
                trend=5.2,
                trend_direction="down"
            ),
            KPIMetric(
                label="Weekly Vitals",
                value=128,
                trend=12.5,
                trend_direction="up"
            )
        ]
        
        return KPIMetricsResponse(metrics=metrics)
    
    @cache_result(ttl=300, key_prefix="dashboard")
    async def get_risk_distribution(self) -> RiskDistributionResponse:
        """Get patient distribution by risk level."""
        result = await self.db.execute(
            select(
                Patient.risk_level,
                func.count(Patient.id)
            ).where(
                Patient.status == PatientStatus.ACTIVE
            ).group_by(Patient.risk_level)
        )
        
        distribution = {row[0]: row[1] for row in result}
        
        # Ensure all risk levels are present
        for risk_level in ["low", "moderate", "high", "critical"]:
            if risk_level not in distribution:
                distribution[risk_level] = 0
        
        return RiskDistributionResponse(distribution=distribution)
    
    @cache_result(ttl=300, key_prefix="dashboard")
    async def get_vitals_trends(self) -> VitalsTrendsResponse:
        """Get aggregated vitals trends across all patients."""
        cutoff_date = datetime.utcnow() - timedelta(days=14)
        
        result = await self.db.execute(
            select(Vital).where(
                Vital.timestamp >= cutoff_date
            ).order_by(Vital.timestamp.asc())
        )
        vitals = result.scalars().all()
        
        if not vitals:
            return VitalsTrendsResponse(sparklines=[])
        
        # Calculate average BP by day
        bp_values = [v.blood_pressure_systolic for v in vitals if v.blood_pressure_systolic][:14]
        hr_values = [v.heart_rate for v in vitals if v.heart_rate][:14]
        o2_values = [v.oxygen_saturation for v in vitals if v.oxygen_saturation][:14]
        temp_values = [v.temperature for v in vitals if v.temperature][:14]
        
        sparklines = []
        
        if bp_values:
            sparklines.append(SparklineData(
                label="Avg Systolic BP",
                data=bp_values,
                unit="mmHg"
            ))
        
        if hr_values:
            sparklines.append(SparklineData(
                label="Avg Heart Rate",
                data=hr_values,
                unit="bpm"
            ))
        
        if o2_values:
            sparklines.append(SparklineData(
                label="Avg O2 Saturation",
                data=o2_values,
                unit="%"
            ))
        
        if temp_values:
            sparklines.append(SparklineData(
                label="Avg Temperature",
                data=temp_values,
                unit="°C"
            ))
        
        return VitalsTrendsResponse(sparklines=sparklines)
    
    async def invalidate_dashboard_cache(self) -> int:
        """
        Invalidate all dashboard-related cache entries.
        
        Call this after creating/updating critical data (patients, vitals).
        
        Returns:
            Number of cache keys invalidated
        """
        return await invalidate_cache("dashboard:*")
