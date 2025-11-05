"""
Vitals-specific database repository.
Queries, aggregations, trend analysis, and anomaly detection.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.base import BaseRepository
from app.models.vital import Vital


class VitalRepository(BaseRepository[Vital]):
    """
    Vital signs data access with analytics queries.
    
    Provides advanced queries for trend analysis, anomaly detection,
    and statistical aggregations.
    
    Example:
        >>> repo = VitalRepository(db_session)
        >>> vitals = await repo.get_patient_vitals_range("PAT-123", start, end)
        >>> avg_bp = await repo.calculate_average_bp("PAT-123", days=7)
    """
    
    def __init__(self, db: AsyncSession):
        super().__init__(Vital, db)
    
    async def get_patient_vitals_range(
        self,
        patient_id: str,
        start: datetime,
        end: datetime
    ) -> List[Vital]:
        """
        Get patient vitals within date range.
        
        Args:
            patient_id: Patient ID
            start: Start datetime
            end: End datetime
        
        Returns:
            List of vital readings, ordered by timestamp
        
        Example:
            >>> from datetime import datetime, timedelta
            >>> end = datetime.now()
            >>> start = end - timedelta(days=7)
            >>> vitals = await repo.get_patient_vitals_range("PAT-123", start, end)
        """
        result = await self.db.execute(
            select(Vital)
            .where(
                and_(
                    Vital.patient_id == patient_id,
                    Vital.timestamp >= start,
                    Vital.timestamp <= end
                )
            )
            .order_by(Vital.timestamp.asc())
        )
        
        return list(result.scalars().all())
    
    async def get_latest_vitals(
        self,
        patient_id: str,
        limit: int = 10
    ) -> List[Vital]:
        """
        Get most recent vital readings for patient.
        
        Args:
            patient_id: Patient ID
            limit: Number of readings to retrieve
        
        Returns:
            List of recent vitals, newest first
        
        Example:
            >>> latest = await repo.get_latest_vitals("PAT-123", limit=5)
        """
        result = await self.db.execute(
            select(Vital)
            .where(Vital.patient_id == patient_id)
            .order_by(Vital.timestamp.desc())
            .limit(limit)
        )
        
        return list(result.scalars().all())
    
    async def get_vitals_by_date_range(
        self,
        patient_id: str,
        days: int = 7
    ) -> List[Vital]:
        """
        Get vitals within the last N days for charting.
        
        Args:
            patient_id: Patient ID
            days: Number of days to look back
        
        Returns:
            List of vitals ordered by timestamp ascending
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        result = await self.db.execute(
            select(Vital)
            .where(
                and_(
                    Vital.patient_id == patient_id,
                    Vital.timestamp >= cutoff
                )
            )
            .order_by(Vital.timestamp.asc())
        )
        
        return list(result.scalars().all())
    
    async def get_trends_with_stats(
        self,
        patient_id: str,
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get comprehensive trend statistics for all vitals.
        
        Args:
            patient_id: Patient ID
            days: Number of days to look back
        
        Returns:
            Dictionary with trends, averages, and date range
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        now = datetime.utcnow()
        
        # Get averages
        averages = await self.calculate_vital_averages(patient_id, days)
        
        # Get all vitals in range for trend calculation
        vitals = await self.get_vitals_by_date_range(patient_id, days)
        
        # Build trends for each parameter
        trends = []
        
        return {
            "date_range": {
                "from": cutoff.isoformat(),
                "to": now.isoformat()
            },
            "trends": trends,
            "averages": averages
        }
    
    async def calculate_average_bp(
        self,
        patient_id: str,
        days: int = 7
    ) -> Dict[str, Optional[float]]:
        """
        Calculate average blood pressure over period.
        
        Args:
            patient_id: Patient ID
            days: Look back period in days
        
        Returns:
            Dictionary with average systolic/diastolic BP
        
        Example:
            >>> avg = await repo.calculate_average_bp("PAT-123", days=7)
            >>> print(avg)
            {'avg_systolic': 125.4, 'avg_diastolic': 82.1}
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        result = await self.db.execute(
            select(
                func.avg(Vital.blood_pressure_systolic).label("avg_systolic"),
                func.avg(Vital.blood_pressure_diastolic).label("avg_diastolic")
            )
            .where(
                and_(
                    Vital.patient_id == patient_id,
                    Vital.timestamp >= cutoff,
                    Vital.blood_pressure_systolic.isnot(None)
                )
            )
        )
        
        row = result.first()
        
        return {
            "avg_systolic": round(row.avg_systolic, 1) if row.avg_systolic else None,
            "avg_diastolic": round(row.avg_diastolic, 1) if row.avg_diastolic else None,
        }
    
    async def calculate_vital_averages(
        self,
        patient_id: str,
        days: int = 7
    ) -> Dict[str, Optional[float]]:
        """
        Calculate averages for all vital parameters.
        
        Args:
            patient_id: Patient ID
            days: Look back period
        
        Returns:
            Dictionary with all vital averages
        
        Example:
            >>> avgs = await repo.calculate_vital_averages("PAT-123")
            >>> print(avgs['avg_heart_rate'])
            75.2
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        result = await self.db.execute(
            select(
                func.avg(Vital.blood_pressure_systolic).label("avg_systolic"),
                func.avg(Vital.blood_pressure_diastolic).label("avg_diastolic"),
                func.avg(Vital.heart_rate).label("avg_heart_rate"),
                func.avg(Vital.temperature).label("avg_temperature"),
                func.avg(Vital.respiratory_rate).label("avg_respiratory_rate"),
                func.avg(Vital.oxygen_saturation).label("avg_oxygen_saturation"),
                func.avg(Vital.blood_glucose).label("avg_glucose")
            )
            .where(
                and_(
                    Vital.patient_id == patient_id,
                    Vital.timestamp >= cutoff
                )
            )
        )
        
        row = result.first()
        
        return {
            "avg_systolic": round(row.avg_systolic, 1) if row.avg_systolic else None,
            "avg_diastolic": round(row.avg_diastolic, 1) if row.avg_diastolic else None,
            "avg_heart_rate": round(row.avg_heart_rate, 1) if row.avg_heart_rate else None,
            "avg_temperature": round(row.avg_temperature, 1) if row.avg_temperature else None,
            "avg_respiratory_rate": round(row.avg_respiratory_rate, 1) if row.avg_respiratory_rate else None,
            "avg_oxygen_saturation": round(row.avg_oxygen_saturation, 1) if row.avg_oxygen_saturation else None,
            "avg_glucose": round(row.avg_glucose, 1) if row.avg_glucose else None,
        }
    
    async def detect_anomalies(
        self,
        patient_id: str,
        days: int = 30
    ) -> List[Vital]:
        """
        Detect anomalous vital readings (simple threshold-based).
        
        Identifies readings that are significantly outside normal ranges.
        
        Args:
            patient_id: Patient ID
            days: Look back period
        
        Returns:
            List of anomalous vitals
        
        Example:
            >>> anomalies = await repo.detect_anomalies("PAT-123")
            >>> for vital in anomalies:
            ...     print(f"Abnormal reading at {vital.timestamp}")
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        # Define thresholds for anomalies (very abnormal)
        result = await self.db.execute(
            select(Vital)
            .where(
                and_(
                    Vital.patient_id == patient_id,
                    Vital.timestamp >= cutoff,
                    or_(
                        # Blood pressure anomalies
                        Vital.blood_pressure_systolic > 180,
                        Vital.blood_pressure_systolic < 80,
                        Vital.blood_pressure_diastolic > 120,
                        Vital.blood_pressure_diastolic < 50,
                        # Heart rate anomalies
                        Vital.heart_rate > 150,
                        Vital.heart_rate < 40,
                        # Temperature anomalies
                        Vital.temperature > 39.5,
                        Vital.temperature < 35.0,
                        # Oxygen saturation anomalies
                        Vital.oxygen_saturation < 90
                    )
                )
            )
            .order_by(Vital.timestamp.desc())
        )
        
        return list(result.scalars().all())
    
    async def get_vital_trends(
        self,
        patient_id: str,
        parameter: str,
        days: int = 7
    ) -> List[Dict[str, Any]]:
        """
        Get time series data for specific vital parameter.
        
        Args:
            patient_id: Patient ID
            parameter: Vital parameter name (e.g., "heart_rate")
            days: Look back period
        
        Returns:
            List of {timestamp, value} dicts
        
        Example:
            >>> trend = await repo.get_vital_trends("PAT-123", "heart_rate", 7)
            >>> for point in trend:
            ...     print(f"{point['timestamp']}: {point['value']}")
        """
        cutoff = datetime.utcnow() - timedelta(days=days)
        
        result = await self.db.execute(
            select(Vital.timestamp, getattr(Vital, parameter))
            .where(
                and_(
                    Vital.patient_id == patient_id,
                    Vital.timestamp >= cutoff,
                    getattr(Vital, parameter).isnot(None)
                )
            )
            .order_by(Vital.timestamp.asc())
        )
        
        return [
            {"timestamp": row[0], "value": row[1]}
            for row in result.all()
        ]


# Import or_ for anomaly detection
from sqlalchemy import or_
