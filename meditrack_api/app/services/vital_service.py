"""
Vitals tracking service: CRUD, trend analysis, anomaly detection.
"""

import uuid
from datetime import datetime, timedelta
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.vital import Vital
from app.models.patient import Patient
from app.schemas.vital import (
    VitalReadingCreate,
    VitalResponse,
    VitalTrendResponse,
    VitalsChartResponse
)
from app.core.exceptions import ResourceNotFoundError
from app.utils.medical_calculations import calculate_linear_trend, get_vital_status


class VitalService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_vital(self, patient_id: str, vital_data: VitalReadingCreate) -> VitalResponse:
        """Record new vital signs reading."""
        # Verify patient exists
        result = await self.db.execute(
            select(Patient).where(Patient.id == patient_id)
        )
        if not result.scalar_one_or_none():
            raise ResourceNotFoundError("Patient", patient_id)
        
        vital = Vital(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            blood_pressure_systolic=vital_data.blood_pressure_systolic,
            blood_pressure_diastolic=vital_data.blood_pressure_diastolic,
            heart_rate=vital_data.heart_rate,
            temperature=vital_data.temperature,
            respiratory_rate=vital_data.respiratory_rate,
            oxygen_saturation=vital_data.oxygen_saturation,
            glucose_level=vital_data.glucose_level,
            timestamp=datetime.utcnow(),
            notes=vital_data.notes
        )
        
        self.db.add(vital)
        await self.db.commit()
        await self.db.refresh(vital)
        
        return VitalResponse.model_validate(vital)
    
    async def get_patient_vitals(self, patient_id: str, limit: int = 50) -> List[VitalResponse]:
        """Get recent vital signs for a patient."""
        result = await self.db.execute(
            select(Vital)
            .where(Vital.patient_id == patient_id)
            .order_by(Vital.timestamp.desc())
            .limit(limit)
        )
        vitals = result.scalars().all()
        
        return [VitalResponse.model_validate(v) for v in vitals]
    
    async def get_trends(self, patient_id: str, days: int = 7) -> VitalTrendResponse:
        """Get vital signs trends with statistical analysis."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await self.db.execute(
            select(Vital)
            .where(Vital.patient_id == patient_id, Vital.timestamp >= cutoff_date)
            .order_by(Vital.timestamp.asc())
        )
        vitals = result.scalars().all()
        
        if not vitals:
            return VitalTrendResponse(
                patient_id=patient_id,
                date_range={"from": cutoff_date.isoformat(), "to": datetime.utcnow().isoformat()},
                trends=[]
            )
        
        # Calculate trends for each parameter
        systolic_values = [v.blood_pressure_systolic for v in vitals if v.blood_pressure_systolic]
        heart_rate_values = [v.heart_rate for v in vitals if v.heart_rate]
        temp_values = [v.temperature for v in vitals if v.temperature]
        o2_values = [v.oxygen_saturation for v in vitals if v.oxygen_saturation]
        
        trends = []
        
        if systolic_values:
            trends.append({
                "parameter": "Systolic BP",
                "current": systolic_values[-1],
                "average": round(sum(systolic_values) / len(systolic_values), 1),
                "trend": calculate_linear_trend(systolic_values),
                "status": get_vital_status("systolic", systolic_values[-1]),
                "unit": "mmHg",
                "readings_count": len(systolic_values)
            })
        
        if heart_rate_values:
            trends.append({
                "parameter": "Heart Rate",
                "current": heart_rate_values[-1],
                "average": round(sum(heart_rate_values) / len(heart_rate_values), 1),
                "trend": calculate_linear_trend(heart_rate_values),
                "status": get_vital_status("heart_rate", heart_rate_values[-1]),
                "unit": "bpm",
                "readings_count": len(heart_rate_values)
            })
        
        if temp_values:
            trends.append({
                "parameter": "Temperature",
                "current": temp_values[-1],
                "average": round(sum(temp_values) / len(temp_values), 1),
                "trend": calculate_linear_trend(temp_values),
                "status": get_vital_status("temperature", temp_values[-1]),
                "unit": "°C",
                "readings_count": len(temp_values)
            })
        
        if o2_values:
            trends.append({
                "parameter": "O2 Saturation",
                "current": o2_values[-1],
                "average": round(sum(o2_values) / len(o2_values), 1),
                "trend": calculate_linear_trend(o2_values),
                "status": get_vital_status("oxygen_saturation", o2_values[-1]),
                "unit": "%",
                "readings_count": len(o2_values)
            })
        
        return VitalTrendResponse(
            patient_id=patient_id,
            date_range={"from": cutoff_date.isoformat(), "to": datetime.utcnow().isoformat()},
            trends=trends
        )
    
    async def get_chart_data(self, patient_id: str, days: int = 7) -> VitalsChartResponse:
        """Get vitals data formatted for charting."""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        result = await self.db.execute(
            select(Vital)
            .where(Vital.patient_id == patient_id, Vital.timestamp >= cutoff_date)
            .order_by(Vital.timestamp.asc())
        )
        vitals = result.scalars().all()
        
        chart_data = {
            "timestamps": [v.timestamp.isoformat() for v in vitals],
            "systolic": [v.blood_pressure_systolic for v in vitals],
            "diastolic": [v.blood_pressure_diastolic for v in vitals],
            "heart_rate": [v.heart_rate for v in vitals],
            "temperature": [v.temperature for v in vitals],
            "oxygen_saturation": [v.oxygen_saturation for v in vitals],
            "glucose_level": [v.glucose_level for v in vitals if v.glucose_level]
        }
        
        return VitalsChartResponse(
            patient_id=patient_id,
            date_range={"from": cutoff_date.isoformat(), "to": datetime.utcnow().isoformat()},
            data=chart_data
        )
