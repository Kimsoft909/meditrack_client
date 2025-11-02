"""
Generic CRUD repository for all models.
Provides type-safe database operations with async/await support.
"""

from typing import TypeVar, Generic, Type, Optional, List, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.exc import IntegrityError
import logging

from app.core.exceptions import ResourceNotFoundError, ValidationError

logger = logging.getLogger(__name__)

T = TypeVar("T")


class BaseRepository(Generic[T]):
    """
    Generic repository for CRUD operations.
    
    Provides standard database operations that work with any SQLAlchemy model.
    Subclass this for model-specific operations.
    
    Example:
        >>> repo = BaseRepository(Patient, db_session)
        >>> patient = await repo.get_by_id("PAT-123")
        >>> patients = await repo.get_all(limit=50)
    """
    
    def __init__(self, model: Type[T], db: AsyncSession):
        """
        Initialize repository with model and database session.
        
        Args:
            model: SQLAlchemy model class
            db: Async database session
        """
        self.model = model
        self.db = db
    
    async def get_by_id(self, id: Any) -> Optional[T]:
        """
        Get single record by primary key.
        
        Args:
            id: Primary key value
        
        Returns:
            Model instance or None if not found
        
        Example:
            >>> patient = await repo.get_by_id("PAT-123")
        """
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_id_or_404(self, id: Any) -> T:
        """
        Get record by ID, raise 404 if not found.
        
        Args:
            id: Primary key value
        
        Returns:
            Model instance
        
        Raises:
            ResourceNotFoundError: If record doesn't exist
        
        Example:
            >>> patient = await repo.get_by_id_or_404("PAT-123")
        """
        instance = await self.get_by_id(id)
        
        if instance is None:
            raise ResourceNotFoundError(
                self.model.__name__,
                str(id)
            )
        
        return instance
    
    async def get_all(
        self,
        limit: int = 100,
        offset: int = 0,
        order_by: Optional[Any] = None
    ) -> List[T]:
        """
        Get all records with pagination.
        
        Args:
            limit: Maximum records to return
            offset: Number of records to skip
            order_by: Column to sort by (optional)
        
        Returns:
            List of model instances
        
        Example:
            >>> patients = await repo.get_all(limit=50, offset=0)
        """
        query = select(self.model)
        
        if order_by is not None:
            query = query.order_by(order_by)
        
        query = query.limit(limit).offset(offset)
        
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def create(self, obj: T) -> T:
        """
        Create new record.
        
        Args:
            obj: Model instance to create
        
        Returns:
            Created instance with generated ID
        
        Raises:
            ValidationError: If creation violates constraints
        
        Example:
            >>> patient = Patient(name="John Doe", ...)
            >>> created = await repo.create(patient)
        """
        try:
            self.db.add(obj)
            await self.db.commit()
            await self.db.refresh(obj)
            return obj
        
        except IntegrityError as e:
            await self.db.rollback()
            logger.error(f"Integrity error creating {self.model.__name__}: {e}")
            raise ValidationError(f"Failed to create {self.model.__name__}: Constraint violation")
    
    async def update(self, id: Any, updates: dict) -> Optional[T]:
        """
        Update record by ID.
        
        Args:
            id: Primary key value
            updates: Dictionary of field updates
        
        Returns:
            Updated instance or None if not found
        
        Example:
            >>> updated = await repo.update("PAT-123", {"status": "discharged"})
        """
        try:
            result = await self.db.execute(
                update(self.model)
                .where(self.model.id == id)
                .values(**updates)
            )
            
            if result.rowcount == 0:
                return None
            
            await self.db.commit()
            return await self.get_by_id(id)
        
        except IntegrityError as e:
            await self.db.rollback()
            logger.error(f"Integrity error updating {self.model.__name__}: {e}")
            raise ValidationError(f"Failed to update: Constraint violation")
    
    async def delete(self, id: Any) -> bool:
        """
        Delete record by ID.
        
        Args:
            id: Primary key value
        
        Returns:
            True if deleted, False if not found
        
        Example:
            >>> deleted = await repo.delete("PAT-123")
        """
        result = await self.db.execute(
            delete(self.model).where(self.model.id == id)
        )
        
        await self.db.commit()
        return result.rowcount > 0
    
    async def exists(self, id: Any) -> bool:
        """
        Check if record exists.
        
        Args:
            id: Primary key value
        
        Returns:
            True if exists, False otherwise
        
        Example:
            >>> exists = await repo.exists("PAT-123")
        """
        result = await self.db.execute(
            select(self.model.id).where(self.model.id == id)
        )
        return result.scalar_one_or_none() is not None
    
    async def count(self, **filters) -> int:
        """
        Count records with optional filters.
        
        Args:
            **filters: Column=value filters
        
        Returns:
            Number of matching records
        
        Example:
            >>> count = await repo.count(status="active")
        """
        from sqlalchemy import func
        
        query = select(func.count()).select_from(self.model)
        
        for key, value in filters.items():
            query = query.where(getattr(self.model, key) == value)
        
        result = await self.db.execute(query)
        return result.scalar() or 0
