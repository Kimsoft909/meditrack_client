"""
Patient medications, prescriptions.
"""

import uuid
from datetime import date

from sqlalchemy import Boolean, Column, Date, ForeignKey, Index, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Medication(Base, TimestampMixin):
    """Patient medication records."""

    __tablename__ = "medications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    drug_id = Column(String, ForeignKey("drugs.id"), nullable=True)

    # Medication details
    name = Column(String, nullable=False)
    dosage = Column(String, nullable=False)
    frequency = Column(String, nullable=False)
    route = Column(String, nullable=True)  # oral, IV, topical, etc.

    # Prescription details
    prescribed_by = Column(String, nullable=True)
    start_date = Column(Date, default=date.today, nullable=False)
    end_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    # Clinical context
    indication = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="medications")
    drug = relationship("Drug")

    __table_args__ = (
        Index("idx_medication_patient", "patient_id"),
        Index("idx_medication_active", "patient_id", "is_active"),
    )

    def __repr__(self):
        return f"<Medication {self.name} for {self.patient_id}>"
