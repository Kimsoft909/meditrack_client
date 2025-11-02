"""Dashboard KPI and statistics tests."""

import pytest
from httpx import AsyncClient
from app.models.patient import Patient

class TestDashboardStats:
    async def test_get_dashboard_stats(self, test_client: AsyncClient, auth_headers: dict, sample_patient: Patient):
        """Test dashboard statistics endpoint."""
        response = await test_client.get("/api/v1/dashboard/stats", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_patients" in data
        assert "active_patients" in data
        assert "critical_alerts" in data

class TestKPIMetrics:
    async def test_get_kpi_metrics(self, test_client: AsyncClient, auth_headers: dict):
        """Test KPI metrics calculation."""
        response = await test_client.get("/api/v1/dashboard/kpis", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "metrics" in data
        
class TestRiskDistribution:
    async def test_get_risk_distribution(self, test_client: AsyncClient, auth_headers: dict):
        """Test risk distribution chart data."""
        response = await test_client.get("/api/v1/dashboard/risk-distribution", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "distribution" in data
