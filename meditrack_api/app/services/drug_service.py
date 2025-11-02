"""
Drug database search and FDA API integration.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from rapidfuzz import fuzz, process
import httpx

from app.models.drug import Drug
from app.schemas.drug_checker import DrugSearchResponse, FDADrugInfoResponse
from app.core.config import settings
from app.core.exceptions import ResourceNotFoundError


class DrugService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def search_drugs(self, query: str, limit: int = 10) -> list[DrugSearchResponse]:
        """Fuzzy search drugs by name."""
        result = await self.db.execute(select(Drug))
        all_drugs = result.scalars().all()
        
        if not all_drugs:
            return []
        
        # Fuzzy matching
        drug_names = [f"{d.name}|{d.id}" for d in all_drugs]
        matches = process.extract(
            query,
            drug_names,
            scorer=fuzz.WRatio,
            limit=limit,
            score_cutoff=70
        )
        
        matched_ids = [m[0].split("|")[1] for m in matches]
        matched_drugs = [d for d in all_drugs if d.id in matched_ids]
        
        return [DrugSearchResponse.model_validate(d) for d in matched_drugs]
    
    async def get_fda_info(self, drug_id: str) -> FDADrugInfoResponse:
        """Fetch drug information from FDA OpenFDA API."""
        result = await self.db.execute(select(Drug).where(Drug.id == drug_id))
        drug = result.scalar_one_or_none()
        
        if not drug:
            raise ResourceNotFoundError("Drug", drug_id)
        
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
