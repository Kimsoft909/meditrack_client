"""
Drug interaction checking service.
"""

from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.drug import Drug
from app.models.drug_interaction import DrugInteraction
from app.schemas.drug_checker import InteractionResponse


class InteractionService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def check_interactions(self, drug_ids: List[str]) -> List[InteractionResponse]:
        """Check for drug-drug interactions."""
        if len(drug_ids) < 2:
            return []
        
        interactions = []
        
        # Fetch drugs
        result = await self.db.execute(
            select(Drug).where(Drug.id.in_(drug_ids))
        )
        drugs = {d.id: d for d in result.scalars().all()}
        
        # Check each pair
        for i, drug1_id in enumerate(drug_ids):
            for drug2_id in drug_ids[i+1:]:
                # Query interaction database
                interaction_result = await self.db.execute(
                    select(DrugInteraction).where(
                        ((DrugInteraction.drug1_id == drug1_id) & (DrugInteraction.drug2_id == drug2_id)) |
                        ((DrugInteraction.drug1_id == drug2_id) & (DrugInteraction.drug2_id == drug1_id))
                    )
                )
                interaction = interaction_result.scalar_one_or_none()
                
                if interaction:
                    drug1 = drugs.get(drug1_id)
                    drug2 = drugs.get(drug2_id)
                    
                    interactions.append(InteractionResponse(
                        drug1_name=drug1.name if drug1 else "Unknown",
                        drug2_name=drug2.name if drug2 else "Unknown",
                        severity=interaction.severity,
                        description=interaction.description,
                        clinical_effects=interaction.clinical_effects,
                        management=interaction.management,
                        evidence_level=interaction.evidence_level
                    ))
        
        # Sort by severity (contraindicated > major > moderate > minor)
        severity_order = {"contraindicated": 0, "major": 1, "moderate": 2, "minor": 3}
        interactions.sort(key=lambda x: severity_order.get(x.severity.lower(), 4))
        
        return interactions
