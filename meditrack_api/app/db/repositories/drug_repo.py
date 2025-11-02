"""
Drug database repository with fuzzy search.
Handles drug queries, interaction lookups, and FDA integration.
"""

from typing import List, Optional
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from rapidfuzz import fuzz
import logging

from app.db.repositories.base import BaseRepository
from app.models.drug import Drug
from app.models.drug_interaction import DrugInteraction

logger = logging.getLogger(__name__)


class DrugRepository(BaseRepository[Drug]):
    """
    Drug data access with fuzzy search and interaction lookup.
    
    Provides intelligent drug search using fuzzy matching
    and multi-drug interaction detection.
    
    Example:
        >>> repo = DrugRepository(db_session)
        >>> results = await repo.fuzzy_search("lisinopril")
        >>> interactions = await repo.get_interactions(["DRUG-001", "DRUG-045"])
    """
    
    def __init__(self, db: AsyncSession):
        super().__init__(Drug, db)
    
    async def fuzzy_search(
        self,
        query: str,
        limit: int = 10,
        threshold: int = 70
    ) -> List[Drug]:
        """
        Fuzzy search for drugs by name.
        
        Uses Levenshtein distance to find similar drug names even with typos.
        Searches across name, generic_name, and brand_names.
        
        Args:
            query: Search term (e.g., "asprin" will match "aspirin")
            limit: Maximum results
            threshold: Minimum similarity score (0-100)
        
        Returns:
            List of matching drugs, sorted by similarity
        
        Example:
            >>> results = await repo.fuzzy_search("lisinopril")
            >>> results = await repo.fuzzy_search("tylenol")  # Matches acetaminophen brands
        """
        query_lower = query.lower().strip()
        
        # First try exact prefix match (fastest path to get quick result)
        result = await self.db.execute(
            select(Drug)
            .where(
                or_(
                    Drug.name.ilike(f"{query}%"),
                    Drug.generic_name.ilike(f"{query}%")
                )
            )
            .limit(limit)
        )
        
        exact_matches = list(result.scalars().all())
        
        if exact_matches:
            return exact_matches
        
        # Fuzzy search on all drugs (slower but more flexible)
        all_drugs_result = await self.db.execute(select(Drug))
        all_drugs = list(all_drugs_result.scalars().all())
        
        # Score each drug
        scored_drugs = []
        
        for drug in all_drugs:
            # Calculate similarity scores
            name_score = fuzz.ratio(query_lower, drug.name.lower())
            generic_score = fuzz.ratio(query_lower, drug.generic_name.lower()) if drug.generic_name else 0
            
            # Check brand names
            brand_score = 0
            if drug.brand_names:
                brand_scores = [fuzz.ratio(query_lower, brand.lower()) for brand in drug.brand_names]
                brand_score = max(brand_scores) if brand_scores else 0
            
            # Take best score
            best_score = max(name_score, generic_score, brand_score)
            
            if best_score >= threshold:
                scored_drugs.append((drug, best_score))
        
        # Sort by score (highest first)
        scored_drugs.sort(key=lambda x: x[1], reverse=True)
        
        return [drug for drug, score in scored_drugs[:limit]]
    
    async def search_by_class(
        self,
        drug_class: str,
        limit: int = 50
    ) -> List[Drug]:
        """
        Search drugs by drug class.
        
        Args:
            drug_class: Drug class (e.g., "ACE Inhibitor", "Beta Blocker")
            limit: Maximum results
        
        Returns:
            List of drugs in that class
        
        Example:
            >>> ace_inhibitors = await repo.search_by_class("ACE Inhibitor")
        """
        # Drug classes are stored as array in PostgreSQL
        result = await self.db.execute(
            select(Drug)
            .where(Drug.drug_class.any(drug_class))
            .limit(limit)
        )
        
        return list(result.scalars().all())
    
    async def get_by_rxcui(self, rxcui: str) -> Optional[Drug]:
        """
        Get drug by RxNorm concept unique identifier.
        
        Args:
            rxcui: RxNorm CUI
        
        Returns:
            Drug or None
        
        Example:
            >>> drug = await repo.get_by_rxcui("104376")  # Lisinopril
        """
        result = await self.db.execute(
            select(Drug).where(Drug.rxcui == rxcui)
        )
        
        return result.scalar_one_or_none()
    
    async def get_interactions(
        self,
        drug_ids: List[str]
    ) -> List[DrugInteraction]:
        """
        Find interactions between multiple drugs.
        
        Checks all pairwise combinations for known interactions.
        
        Args:
            drug_ids: List of drug IDs to check
        
        Returns:
            List of interaction records
        
        Example:
            >>> interactions = await repo.get_interactions(["DRUG-001", "DRUG-045"])
            >>> for interaction in interactions:
            ...     print(f"{interaction.severity}: {interaction.mechanism}")
        """
        if len(drug_ids) < 2:
            return []
        
        # Query for interactions where both drugs are in the list
        result = await self.db.execute(
            select(DrugInteraction)
            .where(
                and_(
                    DrugInteraction.drug1_id.in_(drug_ids),
                    DrugInteraction.drug2_id.in_(drug_ids)
                )
            )
        )
        
        return list(result.scalars().all())
    
    async def get_interaction_by_drugs(
        self,
        drug1_id: str,
        drug2_id: str
    ) -> Optional[DrugInteraction]:
        """
        Get interaction between two specific drugs.
        
        Checks both directions (drug1-drug2 and drug2-drug1).
        
        Args:
            drug1_id: First drug ID
            drug2_id: Second drug ID
        
        Returns:
            Interaction or None
        
        Example:
            >>> interaction = await repo.get_interaction_by_drugs("DRUG-001", "DRUG-045")
        """
        result = await self.db.execute(
            select(DrugInteraction)
            .where(
                or_(
                    and_(
                        DrugInteraction.drug1_id == drug1_id,
                        DrugInteraction.drug2_id == drug2_id
                    ),
                    and_(
                        DrugInteraction.drug1_id == drug2_id,
                        DrugInteraction.drug2_id == drug1_id
                    )
                )
            )
        )
        
        return result.scalar_one_or_none()
    
    async def get_high_severity_interactions(
        self,
        drug_ids: List[str]
    ) -> List[DrugInteraction]:
        """
        Get only high-severity (major/critical) interactions.
        
        Args:
            drug_ids: Drug IDs to check
        
        Returns:
            List of severe interactions
        
        Example:
            >>> critical = await repo.get_high_severity_interactions(drug_ids)
        """
        if len(drug_ids) < 2:
            return []
        
        result = await self.db.execute(
            select(DrugInteraction)
            .where(
                and_(
                    DrugInteraction.drug1_id.in_(drug_ids),
                    DrugInteraction.drug2_id.in_(drug_ids),
                    DrugInteraction.severity.in_(["major", "critical"])
                )
            )
            .order_by(DrugInteraction.severity.desc())
        )
        
        return list(result.scalars().all())
    
    async def search_multi_field(
        self,
        query: str,
        limit: int = 20
    ) -> List[Drug]:
        """
        Search across all drug text fields.
        
        Args:
            query: Search term
            limit: Maximum results
        
        Returns:
            List of matching drugs
        
        Example:
            >>> results = await repo.search_multi_field("blood pressure")
        """
        search_term = f"%{query}%"
        
        result = await self.db.execute(
            select(Drug)
            .where(
                or_(
                    Drug.name.ilike(search_term),
                    Drug.generic_name.ilike(search_term),
                    Drug.mechanism.ilike(search_term),
                    Drug.indications.ilike(search_term)
                )
            )
            .limit(limit)
        )
        
        return list(result.scalars().all())
