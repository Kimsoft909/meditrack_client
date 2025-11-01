"""
Drug interaction rules (severity, evidence).
"""

import uuid

from sqlalchemy import Column, Enum as SQLEnum, ForeignKey, Index, String, Text

from app.core.database import Base
from app.models.base import TimestampMixin


class InteractionSeverity(str, SQLEnum):
    CONTRAINDICATED = "contraindicated"
    MAJOR = "major"
    MODERATE = "moderate"
    MINOR = "minor"


class DrugInteraction(Base, TimestampMixin):
    """Drug-drug interaction data."""

    __tablename__ = "drug_interactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    drug1_id = Column(String, ForeignKey("drugs.id"), nullable=False)
    drug2_id = Column(String, ForeignKey("drugs.id"), nullable=False)

    # Interaction details
    severity = Column(
        SQLEnum(InteractionSeverity, name="interaction_severity"),
        nullable=False,
        index=True,
    )
    description = Column(Text, nullable=False)
    clinical_effects = Column(Text, nullable=True)
    management = Column(Text, nullable=True)

    # Evidence
    evidence_level = Column(String, nullable=True)  # A, B, C, D
    source = Column(String, nullable=True)  # DrugBank, FDA, PubMed

    __table_args__ = (
        Index("idx_interaction_drugs", "drug1_id", "drug2_id"),
        Index("idx_interaction_severity", "severity"),
    )

    def __repr__(self):
        return f"<DrugInteraction {self.drug1_id} <-> {self.drug2_id} ({self.severity})>"
