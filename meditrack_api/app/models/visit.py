"""
Visit history records.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Visit(Base, TimestampMixin):
    """Patient visit/encounter records."""

    __tablename__ = "visits"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)

    visit_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    visit_type = Column(String, nullable=False)  # routine, emergency, follow-up
    department = Column(String, nullable=True)
    provider = Column(String, nullable=True)

    # Visit details
    chief_complaint = Column(String, nullable=True)
    diagnosis = Column(Text, nullable=True)
    treatment = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="visits")

    __table_args__ = (Index("idx_visit_patient_date", "patient_id", "visit_date"),)

    def __repr__(self):
        return f"<Visit {self.id} for {self.patient_id}>"
