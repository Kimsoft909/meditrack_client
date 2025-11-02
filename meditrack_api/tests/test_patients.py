"""
Patient CRUD operations, pagination, search, and filtering tests.
"""

import pytest
from datetime import date
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Patient, PatientStatus, RiskLevel


class TestPatientCreation:
    """Test patient creation endpoint."""
    
    async def test_create_patient_with_all_fields(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test creating patient with complete data."""
        response = await test_client.post(
            "/api/v1/patients",
            headers=auth_headers,
            json={
                "first_name": "Jane",
                "last_name": "Smith",
                "date_of_birth": "1990-03-20",
                "sex": "F",
                "blood_type": "O+",
                "contact_number": "+12025559876",
                "email": "jane.smith@email.com",
                "address": "456 Oak Ave, City, State",
                "weight": 65.0,
                "height": 1.65,
                "allergies": "Sulfa drugs",
                "chronic_conditions": "Asthma",
                "notes": "Prefers morning appointments"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["first_name"] == "Jane"
        assert data["last_name"] == "Smith"
        assert data["bmi"] == pytest.approx(23.88, rel=0.1)  # Auto-calculated
        assert data["age"] == 34  # Auto-calculated
        assert data["status"] == "active"
        assert data["risk_level"] == "low"
        assert data["id"].startswith("PAT-")
    
    async def test_create_patient_minimal_fields(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test creating patient with only required fields."""
        response = await test_client.post(
            "/api/v1/patients",
            headers=auth_headers,
            json={
                "first_name": "Bob",
                "last_name": "Johnson",
                "date_of_birth": "1975-08-10",
                "sex": "M",
                "weight": 90.0,
                "height": 1.80
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["bmi"] == pytest.approx(27.78, rel=0.1)
        assert data["age"] == 49
    
    async def test_create_patient_invalid_weight(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test negative weight is rejected."""
        response = await test_client.post(
            "/api/v1/patients",
            headers=auth_headers,
            json={
                "first_name": "Invalid",
                "last_name": "Patient",
                "date_of_birth": "1990-01-01",
                "sex": "M",
                "weight": -10.0,  # Invalid
                "height": 1.70
            }
        )
        
        assert response.status_code == 422
    
    async def test_create_patient_future_dob(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test future date of birth is rejected."""
        response = await test_client.post(
            "/api/v1/patients",
            headers=auth_headers,
            json={
                "first_name": "Future",
                "last_name": "Baby",
                "date_of_birth": "2030-01-01",  # Future date
                "sex": "F",
                "weight": 3.0,
                "height": 0.50
            }
        )
        
        assert response.status_code == 422


class TestPatientRetrieval:
    """Test patient retrieval endpoints."""
    
    async def test_get_patient_by_id(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test retrieving patient by ID."""
        response = await test_client.get(
            f"/api/v1/patients/{sample_patient.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_patient.id
        assert data["first_name"] == "John"
        assert data["last_name"] == "Doe"
    
    async def test_get_nonexistent_patient(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test 404 for non-existent patient."""
        response = await test_client.get(
            "/api/v1/patients/PAT-NONEXISTENT",
            headers=auth_headers
        )
        
        assert response.status_code == 404


class TestPatientPagination:
    """Test patient list pagination."""
    
    async def test_pagination_first_page(
        self, test_client: AsyncClient, auth_headers: dict, db_session: AsyncSession
    ):
        """Test first page of results."""
        # Create 60 patients
        for i in range(60):
            patient = Patient(
                id=f"PAT-PAGE{i:03d}",
                first_name=f"Patient{i}",
                last_name=f"Test{i}",
                date_of_birth=date(1990, 1, 1),
                age=34,
                sex="M",
                weight=75.0,
                height=1.75,
                bmi=24.5,
                status=PatientStatus.ACTIVE,
                risk_level=RiskLevel.LOW
            )
            db_session.add(patient)
        await db_session.commit()
        
        # Get first page (default 50 items)
        response = await test_client.get(
            "/api/v1/patients?page=1&page_size=50",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 60
        assert data["page"] == 1
        assert data["page_size"] == 50
        assert len(data["patients"]) == 50
    
    async def test_pagination_second_page(
        self, test_client: AsyncClient, auth_headers: dict, db_session: AsyncSession
    ):
        """Test second page contains remaining items."""
        # Create 60 patients
        for i in range(60):
            patient = Patient(
                id=f"PAT-PG2-{i:03d}",
                first_name=f"Patient{i}",
                last_name=f"Test{i}",
                date_of_birth=date(1990, 1, 1),
                age=34,
                sex="F",
                weight=65.0,
                height=1.65,
                bmi=23.9,
                status=PatientStatus.ACTIVE,
                risk_level=RiskLevel.LOW
            )
            db_session.add(patient)
        await db_session.commit()
        
        # Get second page
        response = await test_client.get(
            "/api/v1/patients?page=2&page_size=50",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["patients"]) >= 10  # At least 10 remaining
    
    async def test_pagination_empty_page(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test empty page returns zero results."""
        response = await test_client.get(
            "/api/v1/patients?page=999&page_size=50",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["patients"]) == 0


class TestPatientSearch:
    """Test patient search functionality."""
    
    async def test_search_by_first_name(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test searching patients by first name."""
        response = await test_client.get(
            "/api/v1/patients?search=John",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["patients"]) > 0
        assert any(p["first_name"] == "John" for p in data["patients"])
    
    async def test_search_by_last_name(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test searching patients by last name."""
        response = await test_client.get(
            "/api/v1/patients?search=Doe",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert any(p["last_name"] == "Doe" for p in data["patients"])
    
    async def test_search_by_patient_id(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test searching by patient ID."""
        response = await test_client.get(
            f"/api/v1/patients?search={sample_patient.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["patients"]) == 1
        assert data["patients"][0]["id"] == sample_patient.id


class TestPatientFiltering:
    """Test patient filtering by status and risk level."""
    
    async def test_filter_by_status_active(
        self, test_client: AsyncClient, auth_headers: dict, db_session: AsyncSession
    ):
        """Test filtering active patients only."""
        # Create mix of active and discharged
        for i in range(5):
            status = PatientStatus.ACTIVE if i < 3 else PatientStatus.DISCHARGED
            patient = Patient(
                id=f"PAT-STATUS{i}",
                first_name=f"Status{i}",
                last_name="Test",
                date_of_birth=date(1985, 1, 1),
                age=39,
                sex="M",
                weight=75.0,
                height=1.75,
                bmi=24.5,
                status=status,
                risk_level=RiskLevel.LOW
            )
            db_session.add(patient)
        await db_session.commit()
        
        response = await test_client.get(
            "/api/v1/patients?status_filter=active",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert all(p["status"] == "active" for p in data["patients"])
    
    async def test_filter_by_risk_level(
        self, test_client: AsyncClient, auth_headers: dict, db_session: AsyncSession
    ):
        """Test filtering by risk level."""
        # Create patients with different risk levels
        for i, risk in enumerate([RiskLevel.LOW, RiskLevel.MODERATE, RiskLevel.HIGH, RiskLevel.CRITICAL]):
            patient = Patient(
                id=f"PAT-RISK{i}",
                first_name=f"Risk{i}",
                last_name="Test",
                date_of_birth=date(1980, 1, 1),
                age=44,
                sex="F",
                weight=70.0,
                height=1.70,
                bmi=24.2,
                status=PatientStatus.ACTIVE,
                risk_level=risk
            )
            db_session.add(patient)
        await db_session.commit()
        
        response = await test_client.get(
            "/api/v1/patients?risk_filter=critical",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert all(p["risk_level"] == "critical" for p in data["patients"])


class TestPatientUpdate:
    """Test patient update operations."""
    
    async def test_update_patient_info(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test updating patient information."""
        response = await test_client.patch(
            f"/api/v1/patients/{sample_patient.id}",
            headers=auth_headers,
            json={
                "contact_number": "+19195551234",
                "email": "john.doe.updated@email.com",
                "risk_level": "moderate"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["contact_number"] == "+19195551234"
        assert data["email"] == "john.doe.updated@email.com"
        assert data["risk_level"] == "moderate"
    
    async def test_update_weight_recalculates_bmi(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test BMI is recalculated when weight changes."""
        response = await test_client.patch(
            f"/api/v1/patients/{sample_patient.id}",
            headers=auth_headers,
            json={"weight": 85.0}
        )
        
        assert response.status_code == 200
        data = response.json()
        # BMI = 85 / (1.75^2) ≈ 27.76
        assert data["bmi"] == pytest.approx(27.76, rel=0.1)


class TestPatientDeletion:
    """Test patient soft delete."""
    
    async def test_delete_patient_soft_delete(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test patient is soft deleted (status changed to discharged)."""
        response = await test_client.delete(
            f"/api/v1/patients/{sample_patient.id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify patient still exists but is discharged
        get_response = await test_client.get(
            f"/api/v1/patients/{sample_patient.id}",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "discharged"


class TestBMICalculation:
    """Test BMI auto-calculation."""
    
    async def test_bmi_calculation_accuracy(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test BMI formula: weight / (height^2)."""
        test_cases = [
            (70.0, 1.75, 22.86),  # Normal BMI
            (100.0, 1.80, 30.86),  # Obese
            (50.0, 1.60, 19.53),  # Underweight
        ]
        
        for weight, height, expected_bmi in test_cases:
            response = await test_client.post(
                "/api/v1/patients",
                headers=auth_headers,
                json={
                    "first_name": "BMI",
                    "last_name": "Test",
                    "date_of_birth": "1990-01-01",
                    "sex": "M",
                    "weight": weight,
                    "height": height
                }
            )
            
            assert response.status_code == 201
            data = response.json()
            assert data["bmi"] == pytest.approx(expected_bmi, rel=0.1)


class TestAgeCalculation:
    """Test age auto-calculation from DOB."""
    
    async def test_age_calculation(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test age is correctly calculated from date of birth."""
        response = await test_client.post(
            "/api/v1/patients",
            headers=auth_headers,
            json={
                "first_name": "Age",
                "last_name": "Test",
                "date_of_birth": "2000-06-15",
                "sex": "F",
                "weight": 60.0,
                "height": 1.65
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        # Age should be 24 (2025 - 2000, adjusted for birth month)
        assert data["age"] in [24, 23]  # Depends on current date
