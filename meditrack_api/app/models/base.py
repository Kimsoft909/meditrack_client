"""
Base model with common fields (id, created_at, updated_at).
"""

from datetime import datetime

from sqlalchemy import Column, DateTime, String
from sqlalchemy.orm import declarative_mixin


@declarative_mixin
class TimestampMixin:
    """Mixin for created_at and updated_at timestamps."""

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


@declarative_mixin
class BaseModelMixin(TimestampMixin):
    """Base mixin with common fields."""

    id = Column(String, primary_key=True, index=True)
