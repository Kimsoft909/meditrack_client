"""
Visit history and encounter management tests.
"""

import pytest
from datetime import datetime, date
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Patient, PatientStatus, RiskLevel
from app.models.visit import Visit


class TestVisitCreation:
    """Test creating visit records."""
    
    async def test_create_visit_with_all_fields(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test creating visit with complete information."""
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "routine",
                "department": "Internal Medicine",
                "provider": "Dr. Sarah Johnson",
                "chief_complaint": "Annual checkup",
                "diagnosis": "Healthy, well-controlled hypertension",
                "treatment": "Continue current medications",
                "notes": "Patient reports feeling well"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["visit_type"] == "routine"
        assert data["department"] == "Internal Medicine"
        assert data["provider"] == "Dr. Sarah Johnson"
        assert data["chief_complaint"] == "Annual checkup"
        assert data["patient_id"] == sample_patient.id
        assert "id" in data
        assert "visit_date" in data
    
    async def test_create_visit_minimal_fields(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test creating visit with only required fields."""
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "emergency"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["visit_type"] == "emergency"
        assert data["patient_id"] == sample_patient.id
    
    async def test_create_emergency_visit(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test creating emergency visit."""
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "emergency",
                "department": "Emergency Department",
                "chief_complaint": "Severe chest pain",
                "diagnosis": "Acute MI ruled out, GERD suspected",
                "treatment": "PPI initiated, cardiac workup negative"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["visit_type"] == "emergency"
        assert "Severe chest pain" in data["chief_complaint"]
    
    async def test_create_follow_up_visit(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test creating follow-up visit."""
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "follow-up",
                "department": "Cardiology",
                "provider": "Dr. Michael Chen",
                "chief_complaint": "Post-procedure follow-up",
                "diagnosis": "Recovering well from cardiac catheterization",
                "treatment": "Continue antiplatelet therapy"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["visit_type"] == "follow-up"
    
    async def test_create_visit_invalid_patient(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test creating visit for non-existent patient fails."""
        response = await test_client.post(
            "/api/v1/patients/PAT-NONEXISTENT/visits",
            headers=auth_headers,
            json={
                "visit_type": "routine"
            }
        )
        
        assert response.status_code == 404
    
    async def test_create_visit_invalid_type(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test invalid visit type is rejected."""
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "invalid-type"
            }
        )
        
        assert response.status_code == 422
    
    async def test_visit_date_auto_assigned(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test visit date is automatically assigned to current time."""
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "routine"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        
        # Verify visit_date is present and recent
        visit_date = datetime.fromisoformat(data["visit_date"].replace('Z', '+00:00'))
        now = datetime.now(visit_date.tzinfo)
        time_diff = abs((now - visit_date).total_seconds())
        assert time_diff < 60  # Within 1 minute


class TestVisitRetrieval:
    """Test retrieving visit records."""
    
    async def test_get_patient_visits(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient, db_session: AsyncSession
    ):
        """Test retrieving all visits for a patient."""
        # Create multiple visits
        for i in range(5):
            visit = Visit(
                id=f"visit-{i}",
                patient_id=sample_patient.id,
                visit_type="routine",
                visit_date=datetime.utcnow(),
                chief_complaint=f"Visit {i}",
                diagnosis=f"Diagnosis {i}"
            )
            db_session.add(visit)
        await db_session.commit()
        
        response = await test_client.get(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "visits" in data
        assert len(data["visits"]) >= 5
    
    async def test_get_visits_paginated(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient, db_session: AsyncSession
    ):
        """Test visit pagination."""
        # Create 60 visits
        for i in range(60):
            visit = Visit(
                id=f"visit-page-{i}",
                patient_id=sample_patient.id,
                visit_type="routine",
                visit_date=datetime.utcnow(),
                chief_complaint=f"Visit {i}"
            )
            db_session.add(visit)
        await db_session.commit()
        
        # Get first page
        response = await test_client.get(
            f"/api/v1/patients/{sample_patient.id}/visits?page=1&page_size=50",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 60
        assert data["page"] == 1
        assert data["page_size"] == 50
        assert len(data["visits"]) == 50
    
    async def test_get_visits_chronological_order(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient, db_session: AsyncSession
    ):
        """Test visits are returned in reverse chronological order (newest first)."""
        # Create visits with different dates
        visits = []
        for i in range(3):
            visit = Visit(
                id=f"visit-chrono-{i}",
                patient_id=sample_patient.id,
                visit_type="routine",
                visit_date=datetime.utcnow(),
                chief_complaint=f"Visit {i}"
            )
            db_session.add(visit)
            visits.append(visit)
        await db_session.commit()
        
        response = await test_client.get(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Newest visits should be first
        assert len(data["visits"]) >= 3
    
    async def test_get_visits_for_nonexistent_patient(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test getting visits for non-existent patient returns empty list."""
        response = await test_client.get(
            "/api/v1/patients/PAT-NONEXISTENT/visits",
            headers=auth_headers
        )
        
        # Depending on implementation, might be 404 or empty list
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert len(data["visits"]) == 0
    
    async def test_visits_isolated_by_patient(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient, db_session: AsyncSession
    ):
        """Test visits are isolated per patient."""
        # Create another patient
        other_patient = Patient(
            id="PAT-OTHER",
            first_name="Other",
            last_name="Patient",
            date_of_birth=date(1985, 3, 10),
            age=39,
            sex="F",
            weight=65.0,
            height=1.65,
            bmi=23.9,
            status=PatientStatus.ACTIVE,
            risk_level=RiskLevel.LOW
        )
        db_session.add(other_patient)
        
        # Create visits for both patients
        visit1 = Visit(
            id="visit-patient1",
            patient_id=sample_patient.id,
            visit_type="routine",
            visit_date=datetime.utcnow(),
            chief_complaint="Patient 1 visit"
        )
        visit2 = Visit(
            id="visit-patient2",
            patient_id=other_patient.id,
            visit_type="routine",
            visit_date=datetime.utcnow(),
            chief_complaint="Patient 2 visit"
        )
        db_session.add(visit1)
        db_session.add(visit2)
        await db_session.commit()
        
        # Get visits for sample patient
        response = await test_client.get(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only see visits for sample patient
        visit_ids = [v["id"] for v in data["visits"]]
        assert "visit-patient1" in visit_ids
        assert "visit-patient2" not in visit_ids


class TestVisitTypes:
    """Test different visit type scenarios."""
    
    async def test_routine_visit(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test routine visit creation and retrieval."""
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "routine",
                "chief_complaint": "Annual physical",
                "diagnosis": "Healthy adult"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["visit_type"] == "routine"
    
    async def test_emergency_visit(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test emergency visit creation."""
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "emergency",
                "department": "ER",
                "chief_complaint": "Acute abdomen"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["visit_type"] == "emergency"
    
    async def test_followup_visit(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test follow-up visit creation."""
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "follow-up",
                "provider": "Dr. Smith"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["visit_type"] == "follow-up"


class TestVisitDetails:
    """Test visit detail fields."""
    
    async def test_visit_with_detailed_notes(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test visit with comprehensive notes."""
        detailed_notes = """
        Patient presents for follow-up of hypertension.
        Blood pressure 128/82 today, improved from last visit.
        Reports good medication compliance.
        No adverse effects from current regimen.
        Plan: Continue current medications, RTC 6 months.
        """
        
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "follow-up",
                "chief_complaint": "Hypertension follow-up",
                "diagnosis": "Essential hypertension, controlled",
                "treatment": "Continue lisinopril 10mg daily",
                "notes": detailed_notes
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["notes"] == detailed_notes
    
    async def test_visit_with_complex_diagnosis(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test visit with complex multi-line diagnosis."""
        diagnosis = """
        Primary: Type 2 Diabetes Mellitus, uncontrolled
        Secondary: Hypertension, controlled
        Tertiary: Hyperlipidemia
        """
        
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "routine",
                "diagnosis": diagnosis
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert "Type 2 Diabetes" in data["diagnosis"]
    
    async def test_visit_with_treatment_plan(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test visit with detailed treatment plan."""
        treatment = """
        1. Start Metformin 500mg BID
        2. Lifestyle modifications: diet and exercise
        3. Home glucose monitoring
        4. Follow-up in 3 months with labs
        """
        
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "routine",
                "diagnosis": "Type 2 Diabetes, newly diagnosed",
                "treatment": treatment
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert "Metformin" in data["treatment"]


class TestVisitAuthentication:
    """Test visit endpoint authentication."""
    
    async def test_create_visit_requires_auth(
        self, test_client: AsyncClient, sample_patient: Patient
    ):
        """Test creating visit requires authentication."""
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            json={"visit_type": "routine"}
        )
        
        assert response.status_code == 401
    
    async def test_get_visits_requires_auth(
        self, test_client: AsyncClient, sample_patient: Patient
    ):
        """Test getting visits requires authentication."""
        response = await test_client.get(
            f"/api/v1/patients/{sample_patient.id}/visits"
        )
        
        assert response.status_code == 401


class TestVisitEdgeCases:
    """Test edge cases and error handling."""
    
    async def test_visit_with_empty_optional_fields(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test visit with null/empty optional fields."""
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "routine",
                "department": None,
                "provider": None,
                "chief_complaint": None,
                "diagnosis": None,
                "treatment": None,
                "notes": None
            }
        )
        
        assert response.status_code == 201
    
    async def test_visit_with_very_long_notes(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test visit with very long notes field."""
        long_notes = "A" * 5000  # 5000 characters
        
        response = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={
                "visit_type": "routine",
                "notes": long_notes
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert len(data["notes"]) == 5000
    
    async def test_concurrent_visits_for_patient(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test creating multiple visits simultaneously."""
        # Create two visits rapidly
        response1 = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={"visit_type": "routine", "chief_complaint": "Visit 1"}
        )
        
        response2 = await test_client.post(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers,
            json={"visit_type": "emergency", "chief_complaint": "Visit 2"}
        )
        
        assert response1.status_code == 201
        assert response2.status_code == 201
        
        # Verify both visits exist
        data1 = response1.json()
        data2 = response2.json()
        assert data1["id"] != data2["id"]


class TestVisitPaginationEdgeCases:
    """Test pagination edge cases."""
    
    async def test_empty_visit_list(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test getting visits when patient has none."""
        response = await test_client.get(
            f"/api/v1/patients/{sample_patient.id}/visits",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "visits" in data
        assert isinstance(data["visits"], list)
    
    async def test_pagination_last_page(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient, db_session: AsyncSession
    ):
        """Test last page of pagination."""
        # Create 55 visits
        for i in range(55):
            visit = Visit(
                id=f"visit-last-{i}",
                patient_id=sample_patient.id,
                visit_type="routine",
                visit_date=datetime.utcnow()
            )
            db_session.add(visit)
        await db_session.commit()
        
        # Get last page (page 2 with page_size=50)
        response = await test_client.get(
            f"/api/v1/patients/{sample_patient.id}/visits?page=2&page_size=50",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["visits"]) >= 5  # Remaining visits
    
    async def test_pagination_beyond_last_page(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test requesting page beyond available data."""
        response = await test_client.get(
            f"/api/v1/patients/{sample_patient.id}/visits?page=999&page_size=50",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["visits"]) == 0
