"""
Patient-specific database repository.
Complex queries, search, filtering, and relationship loading.
"""

from typing import List, Optional
from sqlalchemy import select, or_, and_, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.base import BaseRepository
from app.models.patient import Patient, PatientStatus, RiskLevel


class PatientRepository(BaseRepository[Patient]):
    """
    Patient data access with advanced querying.
    
    Extends base repository with patient-specific operations like
    search, status filtering, and relationship eager loading.
    
    Example:
        >>> repo = PatientRepository(Patient, db_session)
        >>> results = await repo.search_by_name("John")
        >>> high_risk = await repo.get_high_risk_patients()
    """
    
    def __init__(self, db: AsyncSession):
        super().__init__(Patient, db)
    
    async def search_by_name(
        self,
        query: str,
        limit: int = 50
    ) -> List[Patient]:
        """
        Search patients by first name, last name, or ID.
        
        Case-insensitive partial matching.
        
        Args:
            query: Search term
            limit: Maximum results
        
        Returns:
            List of matching patients
        
        Example:
            >>> results = await repo.search_by_name("john")
            >>> # Matches: "John Doe", "Johnny Smith", "PAT-JOHN123"
        """
        search_term = f"%{query}%"
        
        result = await self.db.execute(
            select(Patient)
            .where(
                or_(
                    Patient.id.ilike(search_term),
                    Patient.first_name.ilike(search_term),
                    Patient.last_name.ilike(search_term),
                    (Patient.first_name + " " + Patient.last_name).ilike(search_term)
                )
            )
            .limit(limit)
        )
        
        return list(result.scalars().all())
    
    async def get_by_status(
        self,
        status: PatientStatus,
        limit: int = 100
    ) -> List[Patient]:
        """
        Get all patients with specific status.
        
        Args:
            status: Patient status (active, discharged, etc.)
            limit: Maximum results
        
        Returns:
            List of patients
        
        Example:
            >>> active_patients = await repo.get_by_status(PatientStatus.ACTIVE)
        """
        result = await self.db.execute(
            select(Patient)
            .where(Patient.status == status)
            .order_by(Patient.admission_date.desc())
            .limit(limit)
        )
        
        return list(result.scalars().all())
    
    async def get_high_risk_patients(self, limit: int = 100) -> List[Patient]:
        """
        Get patients with high or critical risk level.
        
        Args:
            limit: Maximum results
        
        Returns:
            List of high-risk patients, ordered by risk level
        
        Example:
            >>> high_risk = await repo.get_high_risk_patients()
        """
        result = await self.db.execute(
            select(Patient)
            .where(
                Patient.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL])
            )
            .order_by(
                Patient.risk_level.desc(),
                Patient.admission_date.desc()
            )
            .limit(limit)
        )
        
        return list(result.scalars().all())
    
    async def get_with_vitals(
        self,
        patient_id: str,
        vitals_limit: int = 10
    ) -> Optional[Patient]:
        """
        Get patient with recent vitals eagerly loaded.
        
        Prevents N+1 queries by loading vitals in same query.
        
        Args:
            patient_id: Patient ID
            vitals_limit: Number of recent vitals to load
        
        Returns:
            Patient with vitals relationship loaded
        
        Example:
            >>> patient = await repo.get_with_vitals("PAT-123", vitals_limit=5)
            >>> print(patient.vitals)  # No additional query
        """
        result = await self.db.execute(
            select(Patient)
            .where(Patient.id == patient_id)
            .options(selectinload(Patient.vitals).limit(vitals_limit))
        )
        
        return result.scalar_one_or_none()
    
    async def get_with_medications(self, patient_id: str) -> Optional[Patient]:
        """
        Get patient with medications eagerly loaded.
        
        Args:
            patient_id: Patient ID
        
        Returns:
            Patient with medications relationship loaded
        
        Example:
            >>> patient = await repo.get_with_medications("PAT-123")
            >>> print(patient.medications)
        """
        result = await self.db.execute(
            select(Patient)
            .where(Patient.id == patient_id)
            .options(selectinload(Patient.medications))
        )
        
        return result.scalar_one_or_none()
    
    async def get_recently_admitted(
        self,
        days: int = 7,
        limit: int = 50
    ) -> List[Patient]:
        """
        Get patients admitted in last N days.
        
        Args:
            days: Look back period
            limit: Maximum results
        
        Returns:
            List of recently admitted patients
        
        Example:
            >>> recent = await repo.get_recently_admitted(days=7)
        """
        from datetime import date, timedelta
        
        cutoff_date = date.today() - timedelta(days=days)
        
        result = await self.db.execute(
            select(Patient)
            .where(Patient.admission_date >= cutoff_date)
            .order_by(Patient.admission_date.desc())
            .limit(limit)
        )
        
        return list(result.scalars().all())
    
    async def get_by_age_range(
        self,
        min_age: Optional[int] = None,
        max_age: Optional[int] = None,
        limit: int = 100
    ) -> List[Patient]:
        """
        Get patients within age range.
        
        Args:
            min_age: Minimum age (inclusive)
            max_age: Maximum age (inclusive)
            limit: Maximum results
        
        Returns:
            List of patients
        
        Example:
            >>> elderly = await repo.get_by_age_range(min_age=65)
            >>> children = await repo.get_by_age_range(max_age=18)
        """
        conditions = []
        
        if min_age is not None:
            conditions.append(Patient.age >= min_age)
        
        if max_age is not None:
            conditions.append(Patient.age <= max_age)
        
        query = select(Patient)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        result = await self.db.execute(query.limit(limit))
        return list(result.scalars().all())
    
    async def get_statistics(self) -> dict:
        """
        Get aggregate patient statistics.
        
        Returns:
            Dictionary with counts by status, risk level, age groups
        
        Example:
            >>> stats = await repo.get_statistics()
            >>> print(stats['total_active'])
            150
        """
        # Total counts
        total = await self.count()
        
        # Count by status
        active_count = await self.count(status=PatientStatus.ACTIVE)
        discharged_count = await self.count(status=PatientStatus.DISCHARGED)
        
        # Count by risk level
        high_risk_count = await self.db.execute(
            select(func.count())
            .select_from(Patient)
            .where(Patient.risk_level.in_([RiskLevel.HIGH, RiskLevel.CRITICAL]))
        )
        
        return {
            "total": total,
            "total_active": active_count,
            "total_discharged": discharged_count,
            "high_risk_count": high_risk_count.scalar() or 0,
        }
