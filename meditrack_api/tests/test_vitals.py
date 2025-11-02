"""
Vitals tracking tests: CRUD, trend analysis, anomaly detection.
"""

import pytest
from datetime import datetime, timedelta
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.patient import Patient
from app.models.vital import Vital


class TestVitalCreation:
    """Test vital signs recording."""
    
    async def test_record_new_vitals(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test recording new vital signs for a patient."""
        response = await test_client.post(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals",
            headers=auth_headers,
            json={
                "blood_pressure_systolic": 120,
                "blood_pressure_diastolic": 80,
                "heart_rate": 72,
                "temperature": 37.0,
                "respiratory_rate": 16,
                "oxygen_saturation": 98,
                "glucose_level": 95.0,
                "notes": "Normal reading"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["blood_pressure_systolic"] == 120
        assert data["heart_rate"] == 72
        assert data["patient_id"] == sample_patient.id
    
    async def test_record_vitals_for_nonexistent_patient(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test recording vitals fails for non-existent patient."""
        response = await test_client.post(
            "/api/v1/vitals/patients/PAT-FAKE/vitals",
            headers=auth_headers,
            json={
                "blood_pressure_systolic": 120,
                "blood_pressure_diastolic": 80,
                "heart_rate": 72
            }
        )
        
        assert response.status_code == 404


class TestVitalValidation:
    """Test vital signs validation."""
    
    async def test_invalid_heart_rate_rejected(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test extremely high heart rate is rejected."""
        response = await test_client.post(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals",
            headers=auth_headers,
            json={
                "blood_pressure_systolic": 120,
                "blood_pressure_diastolic": 80,
                "heart_rate": 400  # Implausible
            }
        )
        
        assert response.status_code == 422
    
    async def test_invalid_blood_pressure(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test invalid blood pressure values rejected."""
        response = await test_client.post(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals",
            headers=auth_headers,
            json={
                "blood_pressure_systolic": 300,  # Too high
                "blood_pressure_diastolic": 200,  # Too high
                "heart_rate": 75
            }
        )
        
        assert response.status_code == 422
    
    async def test_negative_values_rejected(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test negative vital values are rejected."""
        response = await test_client.post(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals",
            headers=auth_headers,
            json={
                "blood_pressure_systolic": -120,
                "heart_rate": -75
            }
        )
        
        assert response.status_code == 422


class TestVitalRetrieval:
    """Test vital signs retrieval."""
    
    async def test_get_patient_vitals(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient, sample_vitals: list[Vital]
    ):
        """Test retrieving vital signs history for a patient."""
        response = await test_client.get(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals?limit=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 7  # We created 7 sample vitals
        assert all(v["patient_id"] == sample_patient.id for v in data)
    
    async def test_get_vitals_with_limit(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient, sample_vitals: list[Vital]
    ):
        """Test limit parameter works."""
        response = await test_client.get(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals?limit=3",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 3
    
    async def test_get_vitals_empty_patient(
        self, test_client: AsyncClient, auth_headers: dict, db_session: AsyncSession
    ):
        """Test empty vitals list for patient with no readings."""
        from app.models.patient import Patient, PatientStatus, RiskLevel
        from datetime import date
        
        # Create patient without vitals
        new_patient = Patient(
            id="PAT-NOVITALS",
            first_name="No",
            last_name="Vitals",
            date_of_birth=date(1990, 1, 1),
            age=34,
            sex="M",
            weight=75.0,
            height=1.75,
            bmi=24.5,
            status=PatientStatus.ACTIVE,
            risk_level=RiskLevel.LOW
        )
        db_session.add(new_patient)
        await db_session.commit()
        
        response = await test_client.get(
            f"/api/v1/vitals/patients/{new_patient.id}/vitals",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert response.json() == []


class TestVitalTrends:
    """Test vital signs trend analysis."""
    
    async def test_increasing_trend_detection(
        self, test_client: AsyncClient, auth_headers: dict, db_session: AsyncSession, sample_patient: Patient
    ):
        """Test detection of increasing vital trend."""
        # Create increasing BP trend over 7 days
        for day in range(7):
            vital = Vital(
                id=f"trend-inc-{day}",
                patient_id=sample_patient.id,
                blood_pressure_systolic=120 + (day * 5),  # 120, 125, 130, 135, 140, 145, 150
                blood_pressure_diastolic=80,
                heart_rate=75,
                temperature=37.0,
                respiratory_rate=16,
                oxygen_saturation=98,
                timestamp=datetime.utcnow() - timedelta(days=7-day)
            )
            db_session.add(vital)
        await db_session.commit()
        
        response = await test_client.get(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals/trends?days=7",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Find systolic BP trend
        systolic_trend = next(
            (t for t in data["trends"] if t["parameter"] == "Systolic BP"), None
        )
        assert systolic_trend is not None
        assert systolic_trend["trend"] == "increasing"
        assert systolic_trend["current"] == 150
    
    async def test_decreasing_trend_detection(
        self, test_client: AsyncClient, auth_headers: dict, db_session: AsyncSession, sample_patient: Patient
    ):
        """Test detection of decreasing vital trend."""
        # Create decreasing heart rate trend
        for day in range(7):
            vital = Vital(
                id=f"trend-dec-{day}",
                patient_id=sample_patient.id,
                blood_pressure_systolic=120,
                blood_pressure_diastolic=80,
                heart_rate=100 - (day * 3),  # 100, 97, 94, 91, 88, 85, 82
                temperature=37.0,
                timestamp=datetime.utcnow() - timedelta(days=7-day)
            )
            db_session.add(vital)
        await db_session.commit()
        
        response = await test_client.get(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals/trends?days=7",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        hr_trend = next(
            (t for t in data["trends"] if t["parameter"] == "Heart Rate"), None
        )
        assert hr_trend is not None
        assert hr_trend["trend"] == "decreasing"
    
    async def test_stable_trend_detection(
        self, test_client: AsyncClient, auth_headers: dict, db_session: AsyncSession, sample_patient: Patient
    ):
        """Test detection of stable vital trend."""
        # Create stable temperature readings
        for day in range(7):
            vital = Vital(
                id=f"trend-stable-{day}",
                patient_id=sample_patient.id,
                blood_pressure_systolic=120,
                blood_pressure_diastolic=80,
                heart_rate=75,
                temperature=37.0,  # Consistent
                timestamp=datetime.utcnow() - timedelta(days=7-day)
            )
            db_session.add(vital)
        await db_session.commit()
        
        response = await test_client.get(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals/trends?days=7",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        temp_trend = next(
            (t for t in data["trends"] if t["parameter"] == "Temperature"), None
        )
        assert temp_trend is not None
        assert temp_trend["trend"] == "stable"


class TestVitalAnomalyDetection:
    """Test vital signs anomaly detection."""
    
    async def test_high_blood_pressure_detected(
        self, test_client: AsyncClient, auth_headers: dict, db_session: AsyncSession, sample_patient: Patient
    ):
        """Test high BP is flagged."""
        vital = Vital(
            id="bp-high",
            patient_id=sample_patient.id,
            blood_pressure_systolic=185,  # High
            blood_pressure_diastolic=110,  # High
            heart_rate=75,
            timestamp=datetime.utcnow()
        )
        db_session.add(vital)
        await db_session.commit()
        
        response = await test_client.get(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals/trends?days=1",
            headers=auth_headers
        )
        
        data = response.json()
        systolic_trend = next(
            (t for t in data["trends"] if t["parameter"] == "Systolic BP"), None
        )
        assert systolic_trend["status"] == "high"
    
    async def test_low_oxygen_saturation_detected(
        self, test_client: AsyncClient, auth_headers: dict, db_session: AsyncSession, sample_patient: Patient
    ):
        """Test low oxygen saturation is flagged."""
        vital = Vital(
            id="o2-low",
            patient_id=sample_patient.id,
            blood_pressure_systolic=120,
            blood_pressure_diastolic=80,
            heart_rate=75,
            oxygen_saturation=88,  # Low
            timestamp=datetime.utcnow()
        )
        db_session.add(vital)
        await db_session.commit()
        
        response = await test_client.get(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals/trends?days=1",
            headers=auth_headers
        )
        
        data = response.json()
        o2_trend = next(
            (t for t in data["trends"] if t["parameter"] == "O2 Saturation"), None
        )
        assert o2_trend["status"] == "low"


class TestVitalChartData:
    """Test vitals chart data endpoint."""
    
    async def test_chart_data_format(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient, sample_vitals: list[Vital]
    ):
        """Test chart data is properly formatted."""
        response = await test_client.get(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals/chart?days=7",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "data" in data
        chart_data = data["data"]
        
        # Check all required fields
        assert "timestamps" in chart_data
        assert "systolic" in chart_data
        assert "diastolic" in chart_data
        assert "heart_rate" in chart_data
        assert "temperature" in chart_data
        
        # Check arrays have same length
        assert len(chart_data["timestamps"]) == len(chart_data["systolic"])
    
    async def test_chart_data_date_range(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test chart data respects date range parameter."""
        response = await test_client.get(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals/chart?days=1",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "date_range" in data
        assert "from" in data["date_range"]
        assert "to" in data["date_range"]


class TestTrendStatistics:
    """Test trend statistical calculations."""
    
    async def test_average_calculation(
        self, test_client: AsyncClient, auth_headers: dict, db_session: AsyncSession, sample_patient: Patient
    ):
        """Test average is correctly calculated."""
        # Create 5 readings with known average
        values = [120, 125, 130, 125, 120]  # Average = 124
        for i, val in enumerate(values):
            vital = Vital(
                id=f"avg-{i}",
                patient_id=sample_patient.id,
                blood_pressure_systolic=val,
                blood_pressure_diastolic=80,
                heart_rate=75,
                timestamp=datetime.utcnow() - timedelta(days=5-i)
            )
            db_session.add(vital)
        await db_session.commit()
        
        response = await test_client.get(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals/trends?days=7",
            headers=auth_headers
        )
        
        data = response.json()
        systolic_trend = next(
            (t for t in data["trends"] if t["parameter"] == "Systolic BP"), None
        )
        assert systolic_trend["average"] == pytest.approx(124.0, rel=0.1)
    
    async def test_readings_count(
        self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient, sample_vitals: list[Vital]
    ):
        """Test readings_count is accurate."""
        response = await test_client.get(
            f"/api/v1/vitals/patients/{sample_patient.id}/vitals/trends?days=30",
            headers=auth_headers
        )
        
        data = response.json()
        
        # Each trend should have readings_count
        for trend in data["trends"]:
            assert "readings_count" in trend
            assert trend["readings_count"] > 0
