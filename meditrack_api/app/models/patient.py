"""
Patient demographics, status, risk_level.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import Column, Date, Enum as SQLEnum, Float, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class PatientStatus(str, SQLEnum):
    ACTIVE = "active"
    DISCHARGED = "discharged"
    PENDING = "pending"


class RiskLevel(str, SQLEnum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class Patient(Base, TimestampMixin):
    """Patient model with demographics and clinical data."""

    __tablename__ = "patients"

    id = Column(
        String, primary_key=True, default=lambda: f"PAT-{uuid.uuid4().hex[:8].upper()}", index=True
    )
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(Date, nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String(10), nullable=False)  # M, F, Other
    blood_type = Column(String(3), nullable=True)
    contact_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    address = Column(Text, nullable=True)

    # Clinical data
    weight = Column(Float, nullable=False)  # kg
    height = Column(Float, nullable=False)  # meters
    bmi = Column(Float, nullable=False)
    status = Column(SQLEnum(PatientStatus, name="patient_status"), default="active")
    risk_level = Column(SQLEnum(RiskLevel, name="risk_level"), default="low")
    admission_date = Column(Date, default=date.today)

    # Medical history
    allergies = Column(Text, nullable=True)
    chronic_conditions = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    vitals = relationship("Vital", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("Medication", back_populates="patient", cascade="all, delete-orphan")
    visits = relationship("Visit", back_populates="patient", cascade="all, delete-orphan")
    ai_analyses = relationship("AIAnalysis", back_populates="patient")

    __table_args__ = (
        Index("idx_patient_name", "last_name", "first_name"),
        Index("idx_patient_status_risk", "status", "risk_level"),
    )

    @property
    def name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    def __repr__(self):
        return f"<Patient {self.id}: {self.name}>"
