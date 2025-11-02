"""
Medication management tests: CRUD, validation, discontinuation.
"""

import pytest
from datetime import date
from httpx import AsyncClient

from app.models.patient import Patient
from app.models.medication import Medication


class TestMedicationCreation:
    """Test medication creation endpoint."""
    
    async def test_add_medication_to_patient(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test adding new medication to patient."""
        response = await test_client.post(
            f"/api/v1/medications/patients/{sample_patient.id}/medications",
            headers=auth_headers,
            json={
                "name": "Atorvastatin",
                "dosage": "20mg",
                "frequency": "Once daily at bedtime",
                "route": "Oral",
                "prescribed_by": "Dr. Cardio",
                "start_date": "2024-01-15",
                "indication": "High cholesterol",
                "notes": "Take with food"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Atorvastatin"
        assert data["dosage"] == "20mg"
        assert data["is_active"] is True
        assert data["patient_id"] == sample_patient.id
    
    async def test_add_medication_minimal_fields(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test adding medication with only required fields."""
        response = await test_client.post(
            f"/api/v1/medications/patients/{sample_patient.id}/medications",
            headers=auth_headers,
            json={
                "name": "Aspirin",
                "dosage": "81mg",
                "frequency": "Once daily"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Aspirin"
    
    async def test_add_medication_nonexistent_patient(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test adding medication to non-existent patient fails."""
        response = await test_client.post(
            "/api/v1/medications/patients/PAT-FAKE/medications",
            headers=auth_headers,
            json={
                "name": "Medication",
                "dosage": "10mg",
                "frequency": "Daily"
            }
        )
        
        assert response.status_code == 404


class TestMedicationValidation:
    """Test medication data validation."""
    
    async def test_invalid_dosage_format(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test invalid dosage format is rejected."""
        response = await test_client.post(
            f"/api/v1/medications/patients/{sample_patient.id}/medications",
            headers=auth_headers,
            json={
                "name": "Invalid Med",
                "dosage": "abc",  # Invalid format
                "frequency": "Daily"
            }
        )
        
        assert response.status_code == 422
    
    async def test_end_date_before_start_date(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test end date before start date is rejected."""
        response = await test_client.post(
            f"/api/v1/medications/patients/{sample_patient.id}/medications",
            headers=auth_headers,
            json={
                "name": "Bad Dates Med",
                "dosage": "10mg",
                "frequency": "Daily",
                "start_date": "2024-06-01",
                "end_date": "2024-01-01"  # Before start
            }
        )
        
        assert response.status_code == 422


class TestMedicationRetrieval:
    """Test medication retrieval endpoints."""
    
    async def test_get_active_medications(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient, sample_medications: list[Medication]
    ):
        """Test retrieving only active medications."""
        response = await test_client.get(
            f"/api/v1/medications/patients/{sample_patient.id}/medications?active_only=true",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert all(med["is_active"] is True for med in data)
    
    async def test_get_all_medications_including_inactive(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient, sample_medications: list[Medication]
    ):
        """Test retrieving all medications including inactive."""
        response = await test_client.get(
            f"/api/v1/medications/patients/{sample_patient.id}/medications?active_only=false",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2  # We have 2 sample medications
        assert any(not med["is_active"] for med in data)
    
    async def test_get_medications_empty_list(
        self, test_client: AsyncClient, auth_headers: dict, db_session
    ):
        """Test empty medication list for patient with no meds."""
        from app.models.patient import Patient, PatientStatus, RiskLevel
        
        # Create patient without medications
        new_patient = Patient(
            id="PAT-NOMEDS",
            first_name="No",
            last_name="Meds",
            date_of_birth=date(1990, 1, 1),
            age=34,
            sex="F",
            weight=65.0,
            height=1.65,
            bmi=23.9,
            status=PatientStatus.ACTIVE,
            risk_level=RiskLevel.LOW
        )
        db_session.add(new_patient)
        await db_session.commit()
        
        response = await test_client.get(
            f"/api/v1/medications/patients/{new_patient.id}/medications",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert response.json() == []


class TestMedicationUpdate:
    """Test medication update operations."""
    
    async def test_update_medication_dosage(
        self, test_client: AsyncClient, auth_headers: dict, sample_medications: list[Medication]
    ):
        """Test updating medication dosage."""
        med_id = sample_medications[0].id
        
        response = await test_client.patch(
            f"/api/v1/medications/{med_id}",
            headers=auth_headers,
            json={
                "dosage": "20mg",  # Updated from 10mg
                "notes": "Dosage increased per physician"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["dosage"] == "20mg"
        assert "Dosage increased" in data["notes"]
    
    async def test_update_medication_frequency(
        self, test_client: AsyncClient, auth_headers: dict, sample_medications: list[Medication]
    ):
        """Test updating medication frequency."""
        med_id = sample_medications[0].id
        
        response = await test_client.patch(
            f"/api/v1/medications/{med_id}",
            headers=auth_headers,
            json={"frequency": "Twice daily"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["frequency"] == "Twice daily"
    
    async def test_update_nonexistent_medication(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test updating non-existent medication fails."""
        response = await test_client.patch(
            "/api/v1/medications/fake-med-id",
            headers=auth_headers,
            json={"dosage": "10mg"}
        )
        
        assert response.status_code == 404


class TestMedicationDiscontinuation:
    """Test medication discontinuation (soft delete)."""
    
    async def test_discontinue_medication(
        self, test_client: AsyncClient, auth_headers: dict, sample_medications: list[Medication]
    ):
        """Test discontinuing an active medication."""
        med_id = sample_medications[0].id
        
        response = await test_client.delete(
            f"/api/v1/medications/{med_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify medication is now inactive
        get_response = await test_client.get(
            f"/api/v1/medications/patients/{sample_medications[0].patient_id}/medications?active_only=false",
            headers=auth_headers
        )
        
        medications = get_response.json()
        discontinued_med = next((m for m in medications if m["id"] == med_id), None)
        assert discontinued_med is not None
        assert discontinued_med["is_active"] is False
        assert discontinued_med["end_date"] is not None
    
    async def test_discontinue_already_inactive_medication(
        self, test_client: AsyncClient, auth_headers: dict, sample_medications: list[Medication]
    ):
        """Test discontinuing already inactive medication."""
        # Find inactive medication
        inactive_med = next((m for m in sample_medications if not m.is_active), None)
        assert inactive_med is not None
        
        response = await test_client.delete(
            f"/api/v1/medications/{inactive_med.id}",
            headers=auth_headers
        )
        
        # Should still succeed (idempotent)
        assert response.status_code == 204


class TestMedicationSorting:
    """Test medication list sorting."""
    
    async def test_medications_sorted_by_start_date(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient, sample_medications: list[Medication]
    ):
        """Test medications are sorted by start date descending."""
        response = await test_client.get(
            f"/api/v1/medications/patients/{sample_patient.id}/medications?active_only=false",
            headers=auth_headers
        )
        
        medications = response.json()
        
        # Check sorting (most recent first)
        if len(medications) > 1:
            dates = [m["start_date"] for m in medications]
            assert dates == sorted(dates, reverse=True)


class TestPolypharmacy:
    """Test handling of multiple medications."""
    
    async def test_patient_with_many_medications(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient, db_session
    ):
        """Test patient can have multiple active medications."""
        # Add 10 more medications
        for i in range(10):
            med = Medication(
                id=f"poly-med-{i}",
                patient_id=sample_patient.id,
                name=f"Medication {i}",
                dosage=f"{(i+1)*10}mg",
                frequency="Daily",
                start_date=date.today(),
                is_active=True
            )
            db_session.add(med)
        await db_session.commit()
        
        response = await test_client.get(
            f"/api/v1/medications/patients/{sample_patient.id}/medications?active_only=true",
            headers=auth_headers
        )
        
        medications = response.json()
        assert len(medications) >= 10
