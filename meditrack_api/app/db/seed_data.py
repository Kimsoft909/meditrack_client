"""
Database seed data for initial drug library and interactions.
Run with: python -m app.db.seed_data
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.models.drug import Drug
from app.models.drug_interaction import DrugInteraction


# Top 50 commonly prescribed medications
SEED_DRUGS = [
    Drug(
        id="DRUG-001", name="Lisinopril", generic_name="lisinopril",
        brand_names=["Prinivil", "Zestril"], drug_class=["ACE Inhibitor"],
        mechanism="Inhibits angiotensin-converting enzyme", rxcui="104376",
        indications="Hypertension, heart failure"
    ),
    Drug(
        id="DRUG-002", name="Metformin", generic_name="metformin",
        brand_names=["Glucophage"], drug_class=["Biguanide"],
        mechanism="Decreases hepatic glucose production", rxcui="6809",
        indications="Type 2 diabetes"
    ),
    Drug(
        id="DRUG-003", name="Atorvastatin", generic_name="atorvastatin",
        brand_names=["Lipitor"], drug_class=["Statin"],
        mechanism="HMG-CoA reductase inhibitor", rxcui="83367",
        indications="Hyperlipidemia, cardiovascular disease"
    ),
    # Add more drugs as needed
]

# Known drug interactions
SEED_INTERACTIONS = [
    DrugInteraction(
        id="INT-001", drug1_id="DRUG-001", drug2_id="DRUG-002",
        severity="moderate", evidence_level="high",
        mechanism="ACE inhibitors may increase risk of lactic acidosis with metformin",
        clinical_effects=["Lactic acidosis risk"], management="Monitor kidney function",
        monitoring_parameters=["Serum creatinine", "Lactate levels"]
    ),
]


async def seed_drugs(db: AsyncSession):
    """Insert drug data."""
    for drug in SEED_DRUGS:
        db.add(drug)
    await db.commit()
    print(f"✓ Seeded {len(SEED_DRUGS)} drugs")


async def seed_interactions(db: AsyncSession):
    """Insert interaction data."""
    for interaction in SEED_INTERACTIONS:
        db.add(interaction)
    await db.commit()
    print(f"✓ Seeded {len(SEED_INTERACTIONS)} interactions")


async def run_seed():
    """Main seed function."""
    async with AsyncSessionLocal() as db:
        await seed_drugs(db)
        await seed_interactions(db)
    print("✓ Database seeding complete")


if __name__ == "__main__":
    asyncio.run(run_seed())
