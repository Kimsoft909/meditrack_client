"""
AI clinical analysis report generation and retrieval tests.
"""

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from app.models.patient import Patient
from app.models.vital import Vital
from app.models.medication import Medication


class TestAnalysisGeneration:
    """Test AI analysis report generation."""
    
    @patch("app.ai.grok_client.GrokClient.generate_completion")
    async def test_generate_analysis_with_all_options(
        self, mock_grok, test_client: AsyncClient, auth_headers: dict,
        sample_patient: Patient, sample_vitals: list[Vital], sample_medications: list[Medication]
    ):
        """Test generating comprehensive analysis report."""
        # Mock Grok response
        mock_grok.return_value = {
            "choices": [{
                "message": {
                    "content": "Patient shows stable vitals with well-controlled hypertension. Continue current medication regimen."
                }
            }]
        }
        
        response = await test_client.post(
            "/api/v1/ai-analysis/generate",
            headers=auth_headers,
            json={
                "patient_id": sample_patient.id,
                "date_range": {
                    "from": "2024-01-01T00:00:00Z",
                    "to": "2024-01-31T23:59:59Z"
                },
                "options": {
                    "include_vitals": True,
                    "include_medications": True,
                    "include_risk_assessment": True,
                    "include_comparative_analysis": False
                }
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check report structure
        assert "report_id" in data
        assert "patient" in data
        assert "executive_summary" in data
        assert "sections" in data
        assert "metadata" in data
        
        # Verify patient data
        assert data["patient"]["id"] == sample_patient.id
        assert data["patient"]["name"] == "John Doe"
    
    @patch("app.ai.grok_client.GrokClient.generate_completion")
    async def test_generate_analysis_vitals_only(
        self, mock_grok, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test generating analysis with only vitals."""
        mock_grok.return_value = {
            "choices": [{"message": {"content": "Vitals analysis complete."}}]
        }
        
        response = await test_client.post(
            "/api/v1/ai-analysis/generate",
            headers=auth_headers,
            json={
                "patient_id": sample_patient.id,
                "date_range": {
                    "from": "2024-01-01T00:00:00Z",
                    "to": "2024-01-31T23:59:59Z"
                },
                "options": {
                    "include_vitals": True,
                    "include_medications": False,
                    "include_risk_assessment": False
                }
            }
        )
        
        assert response.status_code == 200
    
    async def test_generate_analysis_nonexistent_patient(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test analysis fails for non-existent patient."""
        response = await test_client.post(
            "/api/v1/ai-analysis/generate",
            headers=auth_headers,
            json={
                "patient_id": "PAT-FAKE",
                "date_range": {
                    "from": "2024-01-01T00:00:00Z",
                    "to": "2024-01-31T23:59:59Z"
                }
            }
        )
        
        assert response.status_code == 404


class TestAnalysisComponents:
    """Test individual analysis components."""
    
    @patch("app.ai.grok_client.GrokClient.generate_completion")
    async def test_executive_summary_generated(
        self, mock_grok, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test executive summary is generated."""
        mock_grok.return_value = {
            "choices": [{
                "message": {
                    "content": "EXECUTIVE SUMMARY: Patient is in stable condition with controlled vitals."
                }
            }]
        }
        
        response = await test_client.post(
            "/api/v1/ai-analysis/generate",
            headers=auth_headers,
            json={
                "patient_id": sample_patient.id,
                "date_range": {"from": "2024-01-01T00:00:00Z", "to": "2024-01-31T23:59:59Z"}
            }
        )
        
        data = response.json()
        assert "executive_summary" in data
        assert len(data["executive_summary"]) > 0
    
    @patch("app.ai.grok_client.GrokClient.generate_completion")
    async def test_health_score_calculation(
        self, mock_grok, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test overall health score is calculated."""
        mock_grok.return_value = {
            "choices": [{"message": {"content": "Analysis complete."}}]
        }
        
        response = await test_client.post(
            "/api/v1/ai-analysis/generate",
            headers=auth_headers,
            json={
                "patient_id": sample_patient.id,
                "date_range": {"from": "2024-01-01T00:00:00Z", "to": "2024-01-31T23:59:59Z"}
            }
        )
        
        data = response.json()
        if "overall_health_score" in data and data["overall_health_score"] is not None:
            score = data["overall_health_score"]
            assert 0 <= score <= 100  # Score should be 0-100


class TestAnalysisRetrieval:
    """Test analysis report retrieval."""
    
    @patch("app.ai.grok_client.GrokClient.generate_completion")
    async def test_retrieve_generated_report(
        self, mock_grok, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test retrieving a previously generated report."""
        mock_grok.return_value = {
            "choices": [{"message": {"content": "Report content."}}]
        }
        
        # First generate a report
        gen_response = await test_client.post(
            "/api/v1/ai-analysis/generate",
            headers=auth_headers,
            json={
                "patient_id": sample_patient.id,
                "date_range": {"from": "2024-01-01T00:00:00Z", "to": "2024-01-31T23:59:59Z"}
            }
        )
        
        report_id = gen_response.json()["report_id"]
        
        # Now retrieve it
        retrieve_response = await test_client.get(
            f"/api/v1/ai-analysis/{report_id}",
            headers=auth_headers
        )
        
        assert retrieve_response.status_code == 200
        data = retrieve_response.json()
        assert data["report_id"] == report_id
    
    async def test_retrieve_nonexistent_report(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test 404 for non-existent report."""
        response = await test_client.get(
            "/api/v1/ai-analysis/fake-report-id",
            headers=auth_headers
        )
        
        assert response.status_code == 404


class TestAnalysisExport:
    """Test analysis report export (PDF)."""
    
    @patch("app.ai.grok_client.GrokClient.generate_completion")
    async def test_export_report_as_pdf(
        self, mock_grok, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test exporting report as PDF."""
        mock_grok.return_value = {
            "choices": [{"message": {"content": "Report for export."}}]
        }
        
        # Generate report
        gen_response = await test_client.post(
            "/api/v1/ai-analysis/generate",
            headers=auth_headers,
            json={
                "patient_id": sample_patient.id,
                "date_range": {"from": "2024-01-01T00:00:00Z", "to": "2024-01-31T23:59:59Z"}
            }
        )
        
        report_id = gen_response.json()["report_id"]
        
        # Export as PDF
        export_response = await test_client.get(
            f"/api/v1/ai-analysis/{report_id}/export/pdf",
            headers=auth_headers
        )
        
        assert export_response.status_code == 200
        assert export_response.headers["content-type"] == "application/pdf"


class TestAnalysisErrorHandling:
    """Test error handling in analysis generation."""
    
    @patch("app.ai.grok_client.GrokClient.generate_completion")
    async def test_grok_api_failure_handling(
        self, mock_grok, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test graceful handling of Grok API failures."""
        # Mock API failure
        mock_grok.side_effect = Exception("Grok API unavailable")
        
        response = await test_client.post(
            "/api/v1/ai-analysis/generate",
            headers=auth_headers,
            json={
                "patient_id": sample_patient.id,
                "date_range": {"from": "2024-01-01T00:00:00Z", "to": "2024-01-31T23:59:59Z"}
            }
        )
        
        # Should handle gracefully
        assert response.status_code in [500, 503]  # Server error or service unavailable
    
    @patch("app.ai.grok_client.GrokClient.generate_completion")
    async def test_empty_patient_data_handling(
        self, mock_grok, test_client: AsyncClient, auth_headers: dict, db_session
    ):
        """Test analysis with patient having no vitals or medications."""
        from app.models.patient import Patient, PatientStatus, RiskLevel
        from datetime import date
        
        # Create patient with no data
        empty_patient = Patient(
            id="PAT-EMPTY",
            first_name="Empty",
            last_name="Data",
            date_of_birth=date(1990, 1, 1),
            age=34,
            sex="M",
            weight=75.0,
            height=1.75,
            bmi=24.5,
            status=PatientStatus.ACTIVE,
            risk_level=RiskLevel.LOW
        )
        db_session.add(empty_patient)
        await db_session.commit()
        
        mock_grok.return_value = {
            "choices": [{"message": {"content": "Limited data available."}}]
        }
        
        response = await test_client.post(
            "/api/v1/ai-analysis/generate",
            headers=auth_headers,
            json={
                "patient_id": empty_patient.id,
                "date_range": {"from": "2024-01-01T00:00:00Z", "to": "2024-01-31T23:59:59Z"}
            }
        )
        
        # Should still generate report with available data
        assert response.status_code == 200


class TestAnalysisMetadata:
    """Test analysis report metadata."""
    
    @patch("app.ai.grok_client.GrokClient.generate_completion")
    async def test_report_metadata_includes_generator(
        self, mock_grok, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test report metadata includes generator info."""
        mock_grok.return_value = {
            "choices": [{"message": {"content": "Report content."}}]
        }
        
        response = await test_client.post(
            "/api/v1/ai-analysis/generate",
            headers=auth_headers,
            json={
                "patient_id": sample_patient.id,
                "date_range": {"from": "2024-01-01T00:00:00Z", "to": "2024-01-31T23:59:59Z"}
            }
        )
        
        data = response.json()
        assert "generated_by" in data
        assert "report_date" in data
    
    @patch("app.ai.grok_client.GrokClient.generate_completion")
    async def test_report_includes_analysis_date_range(
        self, mock_grok, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient
    ):
        """Test report includes the analysis date range."""
        mock_grok.return_value = {
            "choices": [{"message": {"content": "Report content."}}]
        }
        
        response = await test_client.post(
            "/api/v1/ai-analysis/generate",
            headers=auth_headers,
            json={
                "patient_id": sample_patient.id,
                "date_range": {
                    "from": "2024-01-01T00:00:00Z",
                    "to": "2024-01-31T23:59:59Z"
                }
            }
        )
        
        data = response.json()
        assert "analysis_date_range" in data
        assert "from" in data["analysis_date_range"]
        assert "to" in data["analysis_date_range"]
