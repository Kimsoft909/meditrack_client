"""
Vitals tracking service: CRUD, trend analysis, anomaly detection.
Refactored to use VitalRepository for optimized queries and analytics.
"""

import uuid
from datetime import datetime
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.vital import Vital
from app.schemas.vital import (
    VitalReadingCreate,
    VitalResponse,
    VitalTrendResponse,
    VitalsChartResponse
)
from app.core.exceptions import ResourceNotFoundError
from app.db.repositories.vital_repo import VitalRepository
from app.db.repositories.patient_repo import PatientRepository


class VitalService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.vital_repo = VitalRepository(db)
        self.patient_repo = PatientRepository(db)
    
    async def create_vital(self, patient_id: str, vital_data: VitalReadingCreate) -> VitalResponse:
        """Record new vital signs reading."""
        # Use repository to verify patient exists
        await self.patient_repo.get_by_id_or_404(patient_id)
        
        vital = Vital(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            blood_pressure_systolic=vital_data.blood_pressure_systolic,
            blood_pressure_diastolic=vital_data.blood_pressure_diastolic,
            heart_rate=vital_data.heart_rate,
            temperature=vital_data.temperature,
            respiratory_rate=vital_data.respiratory_rate,
            oxygen_saturation=vital_data.oxygen_saturation,
            blood_glucose=vital_data.blood_glucose,
            timestamp=datetime.utcnow(),
            notes=vital_data.notes
        )
        
        self.db.add(vital)
        await self.db.commit()
        await self.db.refresh(vital)
        
        return VitalResponse.model_validate(vital)
    
    async def get_patient_vitals(self, patient_id: str, limit: int = 50) -> List[VitalResponse]:
        """Get recent vital signs for a patient using repository."""
        vitals = await self.vital_repo.get_latest_vitals(patient_id, limit=limit)
        return [VitalResponse.model_validate(v) for v in vitals]
    
    async def get_trends(self, patient_id: str, days: int = 7) -> VitalTrendResponse:
        """
        Get vital signs trends using repository's optimized analytics.
        
        Leverages VitalRepository.get_trends_with_stats() for complex aggregations
        and anomaly detection without manual SQL.
        """
        # Use repository's optimized trend calculation
        stats = await self.vital_repo.get_trends_with_stats(patient_id, days=days)
        
        # Get date range from repository stats
        date_range = stats.get("date_range", {
            "from": datetime.utcnow().isoformat(),
            "to": datetime.utcnow().isoformat()
        })
        
        # Repository returns properly formatted trends
        trends = stats.get("trends", [])
        
        return VitalTrendResponse(
            patient_id=patient_id,
            date_range=date_range,
            trends=trends
        )
    
    async def get_chart_data(self, patient_id: str, days: int = 7) -> VitalsChartResponse:
        """
        Get vitals data formatted for charting using repository.
        
        Uses repository query for efficient data retrieval with proper ordering.
        """
        vitals = await self.vital_repo.get_vitals_by_date_range(patient_id, days=days)
        
        chart_data = {
            "timestamps": [v.timestamp.isoformat() for v in vitals],
            "systolic": [v.blood_pressure_systolic for v in vitals],
            "diastolic": [v.blood_pressure_diastolic for v in vitals],
            "heart_rate": [v.heart_rate for v in vitals],
            "temperature": [v.temperature for v in vitals],
            "oxygen_saturation": [v.oxygen_saturation for v in vitals],
            "blood_glucose": [v.blood_glucose for v in vitals if v.blood_glucose]
        }
        
        date_range = {
            "from": vitals[0].timestamp.isoformat() if vitals else datetime.utcnow().isoformat(),
            "to": vitals[-1].timestamp.isoformat() if vitals else datetime.utcnow().isoformat()
        }
        
        return VitalsChartResponse(
            patient_id=patient_id,
            date_range=date_range,
            data=chart_data
        )
