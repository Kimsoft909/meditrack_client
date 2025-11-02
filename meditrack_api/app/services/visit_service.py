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
from app.schemas.visit import VisitCreate, VisitResponse, VisitListResponse
from app.core.exceptions import ResourceNotFoundError
from app.db.repositories.patient_repo import PatientRepository
from app.utils.pagination import PaginationParams, paginate_query


class VisitService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.patient_repo = PatientRepository(db)
    
    async def create_visit(self, patient_id: str, visit_data: VisitCreate) -> VisitResponse:
        """Record a new patient visit."""
        # Use repository to verify patient exists
        await self.patient_repo.get_by_id_or_404(patient_id)
        
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
    
    async def get_patient_visits(
        self,
        patient_id: str,
        page: int = 1,
        page_size: int = 50
    ) -> VisitListResponse:
        """Get paginated visit history for a patient."""
        query = select(Visit).where(
            Visit.patient_id == patient_id
        ).order_by(Visit.visit_date.desc())
        
        # Use standardized pagination utility
        params = PaginationParams(page=page, page_size=page_size)
        paginated = await paginate_query(self.db, query, params)
        
        return VisitListResponse(
            total=paginated.total,
            page=paginated.page,
            page_size=paginated.page_size,
            visits=[VisitResponse.model_validate(v) for v in paginated.items]
        )
