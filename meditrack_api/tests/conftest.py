"""
Shared test fixtures for MediTrack API tests.
"""

import os
import pytest
import asyncio
from datetime import date, datetime
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool
from httpx import AsyncClient, ASGITransport
from unittest.mock import Mock, AsyncMock

from app.core.database import Base, get_db
from app.main import app
from app.models.patient import Patient, PatientStatus, RiskLevel
from app.models.user import User
from app.models.vital import Vital
from app.models.medication import Medication
from app.models.drug import Drug
from app.models.drug_interaction import DrugInteraction
from app.core.security import hash_password


# Set test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def db_engine():
    """Create in-memory SQLite test database engine."""
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False,
    )
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
async def db_session(db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create database session with automatic rollback."""
    async_session_maker = async_sessionmaker(
        db_engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session_maker() as session:
        yield session
        await session.rollback()


@pytest.fixture
async def test_client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create FastAPI test client with database override."""
    
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create test user."""
    user = User(
        id="test-user-001",
        username="testdoctor",
        email="doctor@test.com",
        hashed_password=hash_password("TestPass123!"),
        full_name="Dr. Test Physician",
        specialty="Internal Medicine",
        is_active=True,
        is_superuser=False,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def auth_headers(test_client: AsyncClient, test_user: User) -> dict:
    """Generate authentication headers with valid JWT."""
    response = await test_client.post(
        "/api/v1/auth/login",
        json={"username": "testdoctor", "password": "TestPass123!"}
    )
    token_data = response.json()
    return {"Authorization": f"Bearer {token_data['access_token']}"}


@pytest.fixture
async def sample_patient(db_session: AsyncSession) -> Patient:
    """Create sample patient with complete data."""
    patient = Patient(
        id="PAT-TEST001",
        first_name="John",
        last_name="Doe",
        date_of_birth=date(1980, 5, 15),
        age=44,
        sex="M",
        blood_type="A+",
        contact_number="+12025551234",
        email="john.doe@email.com",
        address="123 Main St, Anytown, USA",
        weight=80.0,
        height=1.75,
        bmi=26.1,
        status=PatientStatus.ACTIVE,
        risk_level=RiskLevel.LOW,
        admission_date=date.today(),
        allergies="Penicillin",
        chronic_conditions="Hypertension",
        notes="Regular checkups"
    )
    db_session.add(patient)
    await db_session.commit()
    await db_session.refresh(patient)
    return patient


@pytest.fixture
async def sample_vitals(db_session: AsyncSession, sample_patient: Patient) -> list[Vital]:
    """Create sample vital signs readings."""
    vitals = []
    for i in range(7):
        vital = Vital(
            id=f"vital-{i}",
            patient_id=sample_patient.id,
            blood_pressure_systolic=120 + (i * 2),
            blood_pressure_diastolic=80,
            heart_rate=75,
            temperature=37.0,
            respiratory_rate=16,
            oxygen_saturation=98,
            glucose_level=95.0,
            timestamp=datetime.utcnow(),
            notes=f"Day {i+1} reading"
        )
        vitals.append(vital)
        db_session.add(vital)
    
    await db_session.commit()
    for v in vitals:
        await db_session.refresh(v)
    
    return vitals


@pytest.fixture
async def sample_medications(db_session: AsyncSession, sample_patient: Patient) -> list[Medication]:
    """Create sample medications."""
    medications = [
        Medication(
            id="med-001",
            patient_id=sample_patient.id,
            name="Lisinopril",
            dosage="10mg",
            frequency="Once daily",
            route="Oral",
            prescribed_by="Dr. Smith",
            start_date=date(2024, 1, 1),
            indication="Hypertension",
            is_active=True,
        ),
        Medication(
            id="med-002",
            patient_id=sample_patient.id,
            name="Metformin",
            dosage="500mg",
            frequency="Twice daily",
            route="Oral",
            prescribed_by="Dr. Smith",
            start_date=date(2024, 1, 1),
            end_date=date(2024, 6, 1),
            indication="Diabetes Type 2",
            is_active=False,
        ),
    ]
    
    for med in medications:
        db_session.add(med)
    
    await db_session.commit()
    for med in medications:
        await db_session.refresh(med)
    
    return medications


@pytest.fixture
async def sample_drugs(db_session: AsyncSession) -> list[Drug]:
    """Create sample drug database entries."""
    drugs = [
        Drug(
            id="DRUG-ASPIRIN",
            name="Aspirin",
            generic_name="Acetylsalicylic Acid",
            brand_names=["Bayer Aspirin", "Ecotrin"],
            drug_class="NSAID",
            indication="Pain relief, anti-inflammatory",
            warnings=["Bleeding risk", "GI irritation"]
        ),
        Drug(
            id="DRUG-WARFARIN",
            name="Warfarin",
            generic_name="Warfarin Sodium",
            brand_names=["Coumadin", "Jantoven"],
            drug_class="Anticoagulant",
            indication="Blood clot prevention",
            warnings=["Bleeding risk", "Requires monitoring"]
        ),
        Drug(
            id="DRUG-LISINOPRIL",
            name="Lisinopril",
            generic_name="Lisinopril",
            brand_names=["Prinivil", "Zestril"],
            drug_class="ACE Inhibitor",
            indication="Hypertension, heart failure",
            warnings=["Angioedema risk", "Kidney monitoring"]
        ),
    ]
    
    for drug in drugs:
        db_session.add(drug)
    
    await db_session.commit()
    for drug in drugs:
        await db_session.refresh(drug)
    
    return drugs


@pytest.fixture
async def sample_interactions(db_session: AsyncSession, sample_drugs: list[Drug]) -> list[DrugInteraction]:
    """Create sample drug interactions."""
    interactions = [
        DrugInteraction(
            id="INT-001",
            drug1_id="DRUG-ASPIRIN",
            drug2_id="DRUG-WARFARIN",
            severity="major",
            description="Increased bleeding risk when combined",
            clinical_effects="Additive anticoagulant effects",
            management="Monitor INR closely, adjust warfarin dose",
            evidence_level="well-documented"
        ),
    ]
    
    for interaction in interactions:
        db_session.add(interaction)
    
    await db_session.commit()
    for interaction in interactions:
        await db_session.refresh(interaction)
    
    return interactions


@pytest.fixture
def mock_grok_client():
    """Mock Grok AI client for testing."""
    mock = Mock()
    mock.generate_completion = AsyncMock(return_value={
        "choices": [{
            "message": {
                "content": "Mock AI response: Patient shows stable vitals with well-controlled hypertension."
            }
        }]
    })
    mock.stream_completion = AsyncMock()
    return mock


@pytest.fixture
def mock_fda_api_response():
    """Mock FDA API response data."""
    return {
        "results": [{
            "active_ingredient": ["Acetylsalicylic Acid"],
            "indications_and_usage": ["Pain relief, fever reduction"],
            "dosage_and_administration": ["325mg to 650mg every 4-6 hours"],
            "warnings": ["Reye's syndrome risk in children", "Bleeding risk"],
            "adverse_reactions": ["GI upset", "Bleeding", "Allergic reactions"],
            "contraindications": ["Hemophilia", "Severe liver disease"],
            "openfda": {"spl_set_id": ["123456"]}
        }]
    }
