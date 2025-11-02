"""
Drug database search and FDA API integration.
Refactored to use DrugRepository for optimized fuzzy search.
"""

from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.schemas.drug_checker import DrugSearchResponse, FDADrugInfoResponse
from app.core.config import settings
from app.core.exceptions import ResourceNotFoundError
from app.db.repositories.drug_repo import DrugRepository


class DrugService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.drug_repo = DrugRepository(db)
    
    async def search_drugs(self, query: str, limit: int = 10) -> list[DrugSearchResponse]:
        """
        Fuzzy search drugs using repository's optimized database query.
        
        Critical performance fix: Uses database-level fuzzy search instead of
        loading entire drug table into memory.
        """
        drugs = await self.drug_repo.fuzzy_search(query, limit=limit, threshold=70)
        return [DrugSearchResponse.model_validate(d) for d in drugs]
    
    async def get_fda_info(self, drug_id: str) -> FDADrugInfoResponse:
        """Fetch drug information from FDA OpenFDA API using repository."""
        drug = await self.drug_repo.get_by_id_or_404(drug_id)
        
        # Try FDA API call
        try:
            if drug.brand_names:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(
                        f"{settings.FDA_API_BASE_URL}/drug/label.json",
                        params={
                            "search": f"openfda.brand_name:{drug.brand_names[0]}",
                            "limit": 1
                        },
                        headers={"Authorization": f"Bearer {settings.FDA_API_KEY}"} if settings.FDA_API_KEY else {}
                    )
                    
                    if response.status_code == 200:
                        fda_data = response.json()
                        if fda_data.get("results"):
                            label = fda_data["results"][0]
                            return FDADrugInfoResponse(
                                drug_name=drug.name,
                                active_ingredient=", ".join(label.get("active_ingredient", ["Unknown"])),
                                indication=", ".join(label.get("indications_and_usage", ["No data"])),
                                dosage=", ".join(label.get("dosage_and_administration", ["No data"])),
                                warnings=label.get("warnings", []),
                                adverse_reactions=label.get("adverse_reactions", [])[:5],
                                contraindications=label.get("contraindications", []),
                                fda_label=label.get("openfda", {}).get("spl_set_id", [""])[0]
                            )
        except Exception:
            pass
        
        # Fallback to database info
        return FDADrugInfoResponse(
            drug_name=drug.name,
            active_ingredient=drug.generic_name or "Unknown",
            indication=drug.indication or "FDA data not available",
            dosage="Consult prescribing information",
            warnings=drug.warnings or ["Complete FDA information not available"],
            adverse_reactions=[],
            contraindications=[],
            fda_label="https://www.accessdata.fda.gov/scripts/cder/daf/"
        )
