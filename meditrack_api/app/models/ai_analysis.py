"""
Stored AI analysis reports.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class AIAnalysis(Base, TimestampMixin):
    """AI-generated clinical analysis reports."""

    __tablename__ = "ai_analyses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    report_id = Column(String, unique=True, nullable=False, index=True)
    patient_id = Column(String, ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)

    # Report metadata
    report_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    generated_by = Column(String, nullable=False)
    analysis_type = Column(String, default="comprehensive")

    # Analysis content (stored as JSON)
    executive_summary = Column(Text, nullable=True)
    sections = Column(JSON, nullable=False)  # {vitals_analysis, medication_review, etc.}
    metadata = Column(JSON, nullable=True)  # Confidence scores, data points, etc.

    # Health score
    overall_health_score = Column(Integer, nullable=True)

    # Relationships
    patient = relationship("Patient", back_populates="ai_analyses")

    __table_args__ = (Index("idx_analysis_patient_date", "patient_id", "report_date"),)

    def __repr__(self):
        return f"<AIAnalysis {self.report_id} for {self.patient_id}>"
