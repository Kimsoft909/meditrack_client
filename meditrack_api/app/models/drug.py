"""
Drug database (RxNorm integrated).
"""

import uuid

from sqlalchemy import Column, Index, String, Text
from sqlalchemy.dialects.postgresql import ARRAY

from app.core.database import Base
from app.models.base import TimestampMixin


class Drug(Base, TimestampMixin):
    """Drug database with RxNorm integration."""

    __tablename__ = "drugs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    rxcui = Column(String, unique=True, nullable=True, index=True)  # RxNorm Concept ID

    # Drug names
    name = Column(String, nullable=False, index=True)
    generic_name = Column(String, nullable=True)
    brand_names = Column(ARRAY(String), nullable=True)

    # Drug classification
    drug_class = Column(String, nullable=True)
    category = Column(String, nullable=True)

    # Clinical information
    indication = Column(Text, nullable=True)
    mechanism_of_action = Column(Text, nullable=True)
    warnings = Column(ARRAY(String), nullable=True)

    # FDA information
    fda_application_number = Column(String, nullable=True)

    __table_args__ = (
        Index("idx_drug_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"}),
    )

    def __repr__(self):
        return f"<Drug {self.name}>"
