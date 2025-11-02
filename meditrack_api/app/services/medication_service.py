"""
Medication management service (prescription handling).
Refactored to use PatientRepository for patient validation.
"""

import uuid
from datetime import date, datetime
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.medication import Medication
from app.schemas.medication import (
    MedicationCreate,
    MedicationUpdate,
    MedicationResponse
)
from app.core.exceptions import ResourceNotFoundError
from app.db.repositories.patient_repo import PatientRepository


class MedicationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.patient_repo = PatientRepository(db)
    
    async def create_medication(
        self,
        patient_id: str,
        medication_data: MedicationCreate
    ) -> MedicationResponse:
        """Add new medication to patient's regimen."""
        # Use repository to verify patient exists with proper error handling
        await self.patient_repo.get_by_id_or_404(patient_id)
        
        medication = Medication(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            name=medication_data.name,
            dosage=medication_data.dosage,
            frequency=medication_data.frequency,
            route=medication_data.route,
            prescribed_by=medication_data.prescribed_by,
            start_date=medication_data.start_date,
            end_date=medication_data.end_date,
            indication=medication_data.indication,
            notes=medication_data.notes,
            drug_id=medication_data.drug_id,
            is_active=True
        )
        
        self.db.add(medication)
        await self.db.commit()
        await self.db.refresh(medication)
        
        return MedicationResponse.model_validate(medication)
    
    async def get_patient_medications(
        self,
        patient_id: str,
        active_only: bool = True
    ) -> List[MedicationResponse]:
        """Get all medications for a patient."""
        query = select(Medication).where(Medication.patient_id == patient_id)
        
        if active_only:
            query = query.where(Medication.is_active == True)
        
        query = query.order_by(Medication.start_date.desc())
        
        result = await self.db.execute(query)
        medications = result.scalars().all()
        
        return [MedicationResponse.model_validate(m) for m in medications]
    
    async def update_medication(
        self,
        medication_id: str,
        updates: MedicationUpdate
    ) -> MedicationResponse:
        """Update medication details."""
        result = await self.db.execute(
            select(Medication).where(Medication.id == medication_id)
        )
        medication = result.scalar_one_or_none()
        
        if not medication:
            raise ResourceNotFoundError("Medication", medication_id)
        
        update_data = updates.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(medication, field, value)
        
        medication.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(medication)
        
        return MedicationResponse.model_validate(medication)
    
    async def discontinue_medication(self, medication_id: str) -> None:
        """Discontinue a medication (soft delete)."""
        result = await self.db.execute(
            select(Medication).where(Medication.id == medication_id)
        )
        medication = result.scalar_one_or_none()
        
        if not medication:
            raise ResourceNotFoundError("Medication", medication_id)
        
        medication.is_active = False
        medication.end_date = date.today()
        medication.updated_at = datetime.utcnow()
        
        await self.db.commit()
