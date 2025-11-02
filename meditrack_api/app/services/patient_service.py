"""
Patient management service: CRUD, search, filtering.
Uses PatientRepository for data access (Phase 1 refactoring).
"""

import uuid
from datetime import date, datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Patient, PatientStatus, RiskLevel
from app.schemas.patient import (
    PatientCreate,
    PatientUpdate,
    PatientResponse,
    PatientListResponse
)
from app.core.exceptions import ResourceNotFoundError, ValidationError
from app.db.repositories.patient_repo import PatientRepository
from app.utils.pagination import PaginationParams, paginate_query
from app.utils.medical_calculations import calculate_bmi
from app.utils.validators import validate_age_from_dob


class PatientService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.patient_repo = PatientRepository(db)
    
    async def create_patient(self, patient_data: PatientCreate) -> PatientResponse:
        """Create new patient record with calculated fields."""
        bmi = calculate_bmi(patient_data.weight, patient_data.height)
        age = validate_age_from_dob(patient_data.date_of_birth)
        
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
        """Get patient by ID using repository."""
        patient = await self.patient_repo.get_by_id_or_404(patient_id)
        return PatientResponse.model_validate(patient)
    
    async def get_patients_paginated(
        self,
        page: int = 1,
        page_size: int = 50,
        search: str = None,
        status_filter: str = None,
        risk_filter: str = None
    ) -> PatientListResponse:
        """Get paginated patient list with filters using repository and pagination utilities."""
        from sqlalchemy import select
        
        # Use repository for search if provided
        if search:
            patients = await self.patient_repo.search_by_name(search, limit=page_size)
            total = len(patients)
            
            return PatientListResponse(
                total=total,
                page=page,
                page_size=page_size,
                patients=[PatientResponse.model_validate(p) for p in patients]
            )
        
        # Build query with filters
        query = select(Patient)
        
        if status_filter:
            query = query.where(Patient.status == status_filter)
        
        if risk_filter:
            query = query.where(Patient.risk_level == risk_filter)
        
        # Add default ordering
        query = query.order_by(Patient.admission_date.desc())
        
        # Use pagination utility
        params = PaginationParams(page=page, page_size=page_size)
        paginated = await paginate_query(self.db, query, params)
        
        return PatientListResponse(
            total=paginated.total,
            page=paginated.page,
            page_size=paginated.page_size,
            patients=[PatientResponse.model_validate(p) for p in paginated.items]
        )
    
    async def update_patient(self, patient_id: str, updates: PatientUpdate) -> PatientResponse:
        """Update patient information using repository."""
        patient = await self.patient_repo.get_by_id_or_404(patient_id)
        
        # Update fields
        update_data = updates.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(patient, field, value)
        
        # Recalculate BMI if weight or height changed
        if "weight" in update_data or "height" in update_data:
            patient.bmi = calculate_bmi(patient.weight, patient.height)
        
        patient.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(patient)
        
        return PatientResponse.model_validate(patient)
    
    async def delete_patient(self, patient_id: str) -> None:
        """Soft delete patient (set status to discharged) using repository."""
        patient = await self.patient_repo.get_by_id_or_404(patient_id)
        
        patient.status = PatientStatus.DISCHARGED
        patient.updated_at = datetime.utcnow()
        
        await self.db.commit()
