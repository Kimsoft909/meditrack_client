"""Drug checker schemas."""

from typing import List, Optional

from pydantic import BaseModel, Field


class DrugSearchResponse(BaseModel):
    """Drug search result."""

    id: str
    name: str
    generic_name: Optional[str]
    brand_names: Optional[List[str]]
    drug_class: Optional[str]
    indication: Optional[str]

    model_config = {"from_attributes": True}


class InteractionCheckRequest(BaseModel):
    """Check drug interactions request."""

    drug_ids: List[str] = Field(..., min_length=2)


class InteractionResponse(BaseModel):
    """Drug interaction result."""

    drug1_name: str
    drug2_name: str
    severity: str
    description: str
    clinical_effects: Optional[str]
    management: Optional[str]
    evidence_level: Optional[str]


class FDADrugInfoResponse(BaseModel):
    """FDA drug information."""

    drug_name: str
    active_ingredient: str
    indication: str
    dosage: str
    warnings: List[str]
    adverse_reactions: List[str]
    contraindications: List[str]
    fda_label: str
