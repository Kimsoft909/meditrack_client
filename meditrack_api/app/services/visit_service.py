"""
Visit history management service.
"""

import uuid
from datetime import datetime
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.visit import Visit
from app.models.patient import Patient
from app.schemas.visit import VisitCreate, VisitResponse
from app.core.exceptions import ResourceNotFoundError


class VisitService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_visit(self, patient_id: str, visit_data: VisitCreate) -> VisitResponse:
        """Record a new patient visit."""
        # Verify patient exists
        result = await self.db.execute(
            select(Patient).where(Patient.id == patient_id)
        )
        if not result.scalar_one_or_none():
            raise ResourceNotFoundError("Patient", patient_id)
        
        visit = Visit(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            visit_date=datetime.utcnow(),
            visit_type=visit_data.visit_type,
            department=visit_data.department,
            provider=visit_data.provider,
            chief_complaint=visit_data.chief_complaint,
            diagnosis=visit_data.diagnosis,
            treatment=visit_data.treatment,
            notes=visit_data.notes
        )
        
        self.db.add(visit)
        await self.db.commit()
        await self.db.refresh(visit)
        
        return VisitResponse.model_validate(visit)
    
    async def get_patient_visits(self, patient_id: str) -> List[VisitResponse]:
        """Get visit history for a patient."""
        result = await self.db.execute(
            select(Visit)
            .where(Visit.patient_id == patient_id)
            .order_by(Visit.visit_date.desc())
        )
        visits = result.scalars().all()
        
        return [VisitResponse.model_validate(v) for v in visits]
