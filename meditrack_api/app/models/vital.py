"""
Vitals readings (BP, HR, temp, O2, glucose).
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, String
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class Vital(Base, TimestampMixin):
    """Vital signs measurements."""

    __tablename__ = "vitals"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # Vital measurements
    blood_pressure_systolic = Column(Float, nullable=False)  # mmHg
    blood_pressure_diastolic = Column(Float, nullable=False)  # mmHg
    heart_rate = Column(Float, nullable=False)  # bpm
    temperature = Column(Float, nullable=False)  # Celsius
    oxygen_saturation = Column(Float, nullable=False)  # %
    respiratory_rate = Column(Float, nullable=True)  # breaths/min
    blood_glucose = Column(Float, nullable=True)  # mg/dL

    # Additional context
    notes = Column(String, nullable=True)
    recorded_by = Column(String, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="vitals")

    __table_args__ = (Index("idx_vital_patient_timestamp", "patient_id", "timestamp"),)

    def __repr__(self):
        return f"<Vital {self.patient_id} at {self.timestamp}>"
