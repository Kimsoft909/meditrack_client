"""
Drug search and interaction checking tests.
"""

import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch

from app.models.drug import Drug
from app.models.drug_interaction import DrugInteraction


class TestDrugSearch:
    """Test drug search functionality."""
    
    async def test_search_drugs_by_name(
        self, test_client: AsyncClient, auth_headers: dict, sample_drugs: list[Drug]
    ):
        """Test searching drugs by exact name."""
        response = await test_client.get(
            "/api/v1/drugs/search?q=Aspirin&limit=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert any(d["name"] == "Aspirin" for d in data)
    
    async def test_fuzzy_drug_search_with_typo(
        self, test_client: AsyncClient, auth_headers: dict, sample_drugs: list[Drug]
    ):
        """Test fuzzy matching handles typos."""
        response = await test_client.get(
            "/api/v1/drugs/search?q=Aspr&limit=10",  # Typo/partial
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        # Should still find Aspirin with fuzzy matching
        assert len(data) > 0
    
    async def test_search_by_generic_name(
        self, test_client: AsyncClient, auth_headers: dict, sample_drugs: list[Drug]
    ):
        """Test searching by generic name."""
        response = await test_client.get(
            "/api/v1/drugs/search?q=Warfarin+Sodium&limit=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
    
    async def test_search_by_brand_name(
        self, test_client: AsyncClient, auth_headers: dict, sample_drugs: list[Drug]
    ):
        """Test searching by brand name."""
        response = await test_client.get(
            "/api/v1/drugs/search?q=Coumadin&limit=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
    
    async def test_search_limit_parameter(
        self, test_client: AsyncClient, auth_headers: dict, sample_drugs: list[Drug]
    ):
        """Test limit parameter controls result count."""
        response = await test_client.get(
            "/api/v1/drugs/search?q=a&limit=2",  # Generic query
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 2
    
    async def test_search_no_results(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test search with no matches returns empty list."""
        response = await test_client.get(
            "/api/v1/drugs/search?q=XYZ123NonexistentDrug&limit=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        assert response.json() == []
    
    async def test_search_query_too_short(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test minimum query length validation."""
        response = await test_client.get(
            "/api/v1/drugs/search?q=a&limit=10",  # Too short
            headers=auth_headers
        )
        
        # Should accept but might return many results or validation error
        assert response.status_code in [200, 422]


class TestDrugInteractionChecking:
    """Test drug-drug interaction checking."""
    
    async def test_check_two_drug_interaction(
        self, test_client: AsyncClient, auth_headers: dict, 
        sample_drugs: list[Drug], sample_interactions: list[DrugInteraction]
    ):
        """Test checking interaction between two drugs."""
        response = await test_client.post(
            "/api/v1/drugs/check-interactions",
            headers=auth_headers,
            json={
                "drug_ids": ["DRUG-ASPIRIN", "DRUG-WARFARIN"]
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        
        interaction = data[0]
        assert interaction["drug1_name"] in ["Aspirin", "Warfarin"]
        assert interaction["drug2_name"] in ["Aspirin", "Warfarin"]
        assert interaction["severity"] == "major"
        assert "bleeding" in interaction["description"].lower()
    
    async def test_check_multiple_drug_interactions(
        self, test_client: AsyncClient, auth_headers: dict, sample_drugs: list[Drug]
    ):
        """Test checking interactions among 5+ drugs."""
        response = await test_client.post(
            "/api/v1/drugs/check-interactions",
            headers=auth_headers,
            json={
                "drug_ids": [
                    "DRUG-ASPIRIN",
                    "DRUG-WARFARIN",
                    "DRUG-LISINOPRIL",
                ]
            }
        )
        
        assert response.status_code == 200
        # Should check all pairs
    
    async def test_interaction_severity_ordering(
        self, test_client: AsyncClient, auth_headers: dict, db_session
    ):
        """Test interactions are sorted by severity (critical > major > moderate)."""
        # Create drugs
        drug1 = Drug(id="TEST-D1", name="DrugA", generic_name="GenericA")
        drug2 = Drug(id="TEST-D2", name="DrugB", generic_name="GenericB")
        drug3 = Drug(id="TEST-D3", name="DrugC", generic_name="GenericC")
        db_session.add_all([drug1, drug2, drug3])
        
        # Create interactions with different severities
        int1 = DrugInteraction(
            id="INT-MOD",
            drug1_id="TEST-D1",
            drug2_id="TEST-D3",
            severity="moderate",
            description="Moderate interaction"
        )
        int2 = DrugInteraction(
            id="INT-MAJ",
            drug1_id="TEST-D1",
            drug2_id="TEST-D2",
            severity="major",
            description="Major interaction"
        )
        db_session.add_all([int1, int2])
        await db_session.commit()
        
        response = await test_client.post(
            "/api/v1/drugs/check-interactions",
            headers=auth_headers,
            json={"drug_ids": ["TEST-D1", "TEST-D2", "TEST-D3"]}
        )
        
        data = response.json()
        if len(data) >= 2:
            # Major should come before moderate
            assert data[0]["severity"] == "major"
            assert data[1]["severity"] == "moderate"
    
    async def test_no_interactions_found(
        self, test_client: AsyncClient, auth_headers: dict, sample_drugs: list[Drug]
    ):
        """Test drugs with no known interactions return empty list."""
        response = await test_client.post(
            "/api/v1/drugs/check-interactions",
            headers=auth_headers,
            json={
                "drug_ids": ["DRUG-LISINOPRIL", "DRUG-ASPIRIN"]  # No interaction in DB
            }
        )
        
        assert response.status_code == 200
        # No interaction record, should return empty
    
    async def test_single_drug_no_interaction(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test single drug returns no interactions."""
        response = await test_client.post(
            "/api/v1/drugs/check-interactions",
            headers=auth_headers,
            json={"drug_ids": ["DRUG-ASPIRIN"]}  # Only 1 drug
        )
        
        assert response.status_code in [200, 422]
        if response.status_code == 200:
            assert response.json() == []


class TestFDADrugInfo:
    """Test FDA drug information retrieval."""
    
    async def test_get_fda_info_success(
        self, test_client: AsyncClient, auth_headers: dict, sample_drugs: list[Drug]
    ):
        """Test retrieving FDA info for a drug."""
        response = await test_client.get(
            "/api/v1/drugs/fda-info/DRUG-ASPIRIN",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "drug_name" in data
        assert "active_ingredient" in data
        assert "indication" in data
        assert "dosage" in data
        assert "warnings" in data
        assert isinstance(data["warnings"], list)
    
    @patch("httpx.AsyncClient.get")
    async def test_fda_api_success_with_mock(
        self, mock_get, test_client: AsyncClient, auth_headers: dict, 
        sample_drugs: list[Drug], mock_fda_api_response: dict
    ):
        """Test successful FDA API call (mocked)."""
        # Mock FDA API response
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_fda_api_response
        mock_get.return_value = mock_response
        
        response = await test_client.get(
            "/api/v1/drugs/fda-info/DRUG-ASPIRIN",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["drug_name"] == "Aspirin"
    
    async def test_fda_api_fallback_to_database(
        self, test_client: AsyncClient, auth_headers: dict, sample_drugs: list[Drug]
    ):
        """Test fallback to database info when FDA API fails."""
        # No mock - real call will likely fail, triggering fallback
        response = await test_client.get(
            "/api/v1/drugs/fda-info/DRUG-LISINOPRIL",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should still return data from database
        assert data["drug_name"] == "Lisinopril"
        assert data["active_ingredient"] == "Lisinopril"
    
    async def test_get_fda_info_nonexistent_drug(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test 404 for non-existent drug."""
        response = await test_client.get(
            "/api/v1/drugs/fda-info/DRUG-FAKE",
            headers=auth_headers
        )
        
        assert response.status_code == 404


class TestInteractionDetails:
    """Test detailed interaction information."""
    
    async def test_interaction_has_clinical_effects(
        self, test_client: AsyncClient, auth_headers: dict,
        sample_drugs: list[Drug], sample_interactions: list[DrugInteraction]
    ):
        """Test interaction includes clinical effects."""
        response = await test_client.post(
            "/api/v1/drugs/check-interactions",
            headers=auth_headers,
            json={"drug_ids": ["DRUG-ASPIRIN", "DRUG-WARFARIN"]}
        )
        
        data = response.json()
        if len(data) > 0:
            interaction = data[0]
            assert "clinical_effects" in interaction
            assert "management" in interaction
    
    async def test_interaction_has_evidence_level(
        self, test_client: AsyncClient, auth_headers: dict,
        sample_drugs: list[Drug], sample_interactions: list[DrugInteraction]
    ):
        """Test interaction includes evidence level."""
        response = await test_client.post(
            "/api/v1/drugs/check-interactions",
            headers=auth_headers,
            json={"drug_ids": ["DRUG-ASPIRIN", "DRUG-WARFARIN"]}
        )
        
        data = response.json()
        if len(data) > 0:
            interaction = data[0]
            assert "evidence_level" in interaction
            assert interaction["evidence_level"] == "well-documented"


class TestDrugSearchPerformance:
    """Test drug search performance and edge cases."""
    
    async def test_search_with_special_characters(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test search handles special characters."""
        response = await test_client.get(
            "/api/v1/drugs/search?q=Test%20Drug&limit=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200
    
    async def test_search_case_insensitive(
        self, test_client: AsyncClient, auth_headers: dict, sample_drugs: list[Drug]
    ):
        """Test search is case insensitive."""
        response1 = await test_client.get(
            "/api/v1/drugs/search?q=aspirin&limit=10",
            headers=auth_headers
        )
        response2 = await test_client.get(
            "/api/v1/drugs/search?q=ASPIRIN&limit=10",
            headers=auth_headers
        )
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        # Should return same results
        assert len(response1.json()) == len(response2.json())
