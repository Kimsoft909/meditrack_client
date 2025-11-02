"""
Patient management service: CRUD, search, filtering.
"""

import uuid
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.models.patient import Patient, PatientStatus, RiskLevel
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse
)
from app.core.exceptions import ResourceNotFoundError, ValidationError


class PatientService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    def _calculate_bmi(self, weight_kg: float, height_m: float) -> float:
        """Calculate BMI from weight and height."""
        return round(weight_kg / (height_m ** 2), 2)
    
    def _calculate_age(self, date_of_birth: date) -> int:
        """Calculate age from date of birth."""
        today = date.today()
        age = today.year - date_of_birth.year
        if today.month < date_of_birth.month or (today.month == date_of_birth.month and today.day < date_of_birth.day):
            age -= 1
        return age
    
    async def create_patient(self, patient_data: PatientCreate) -> PatientResponse:
        """Create new patient record with calculated fields."""
        bmi = self._calculate_bmi(patient_data.weight, patient_data.height)
        age = self._calculate_age(patient_data.date_of_birth)
        
        patient = Patient(
            id=f"PAT-{uuid.uuid4().hex[:8].upper()}",
            first_name=patient_data.first_name,
            last_name=patient_data.last_name,
            date_of_birth=patient_data.date_of_birth,
            age=age,
            sex=patient_data.sex,
            blood_type=patient_data.blood_type,
            contact_number=patient_data.contact_number,
            email=patient_data.email,
            address=patient_data.address,
            weight=patient_data.weight,
            height=patient_data.height,
            bmi=bmi,
            status=PatientStatus.ACTIVE,
            risk_level=RiskLevel.LOW,
            admission_date=date.today(),
            allergies=patient_data.allergies,
            chronic_conditions=patient_data.chronic_conditions,
            notes=patient_data.notes
        )
        
        self.db.add(patient)
        await self.db.commit()
        await self.db.refresh(patient)
        
        return PatientResponse.model_validate(patient)
    
    async def get_patient_by_id(self, patient_id: str) -> PatientResponse:
        """Get patient by ID."""
        result = await self.db.execute(
            select(Patient).where(Patient.id == patient_id)
        )
        patient = result.scalar_one_or_none()
        
        if not patient:
            raise ResourceNotFoundError("Patient", patient_id)
        
        return PatientResponse.model_validate(patient)
    
    async def get_patients_paginated(
        self,
        page: int = 1,
        page_size: int = 50,
        search: str = None,
        status_filter: str = None,
        risk_filter: str = None
    ) -> PatientListResponse:
        """Get paginated patient list with filters."""
        query = select(Patient)
        
        # Apply search filter (name or ID)
        if search:
            query = query.where(
                or_(
                    Patient.id.ilike(f"%{search}%"),
                    Patient.first_name.ilike(f"%{search}%"),
                    Patient.last_name.ilike(f"%{search}%")
                )
            )
        
        # Apply status filter
        if status_filter:
            query = query.where(Patient.status == status_filter)
        
        # Apply risk level filter
        if risk_filter:
            query = query.where(Patient.risk_level == risk_filter)
        
        # Get total count
        count_result = await self.db.execute(
            select(func.count()).select_from(query.subquery())
        )
        total = count_result.scalar()
        
        # Apply pagination
        offset = (page - 1) * page_size
        query = query.offset(offset).limit(page_size).order_by(Patient.admission_date.desc())
        
        result = await self.db.execute(query)
        patients = result.scalars().all()
        
        return PatientListResponse(
            total=total,
            page=page,
            page_size=page_size,
            patients=[PatientResponse.model_validate(p) for p in patients]
        )
    
    async def update_patient(self, patient_id: str, updates: PatientUpdate) -> PatientResponse:
        """Update patient information."""
        result = await self.db.execute(
            select(Patient).where(Patient.id == patient_id)
        )
        patient = result.scalar_one_or_none()
        
        if not patient:
            raise ResourceNotFoundError("Patient", patient_id)
        
        # Update fields
        update_data = updates.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(patient, field, value)
        
        # Recalculate BMI if weight or height changed
        if "weight" in update_data or "height" in update_data:
            patient.bmi = self._calculate_bmi(patient.weight, patient.height)
        
        patient.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(patient)
        
        return PatientResponse.model_validate(patient)
    
    async def delete_patient(self, patient_id: str) -> None:
        """Soft delete patient (set status to discharged)."""
        result = await self.db.execute(
            select(Patient).where(Patient.id == patient_id)
        )
        patient = result.scalar_one_or_none()
        
        if not patient:
            raise ResourceNotFoundError("Patient", patient_id)
        
        patient.status = PatientStatus.DISCHARGED
        patient.updated_at = datetime.utcnow()
        
        await self.db.commit()
