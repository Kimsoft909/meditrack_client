"""Medical calculations utility tests."""

import pytest
from app.utils.medical_calculations import calculate_linear_trend, get_vital_status, calculate_risk_score

class TestLinearTrend:
    def test_increasing_trend(self):
        """Test detection of increasing trend."""
        values = [100, 105, 110, 115, 120]
        assert calculate_linear_trend(values) == "increasing"
    
    def test_decreasing_trend(self):
        """Test detection of decreasing trend."""
        values = [120, 115, 110, 105, 100]
        assert calculate_linear_trend(values) == "decreasing"
    
    def test_stable_trend(self):
        """Test detection of stable trend."""
        values = [100, 100, 101, 100, 99]
        assert calculate_linear_trend(values) == "stable"

class TestVitalStatus:
    def test_normal_blood_pressure(self):
        """Test normal BP status."""
        assert get_vital_status("systolic", 120) == "normal"
    
    def test_high_blood_pressure(self):
        """Test high BP detection."""
        assert get_vital_status("systolic", 160) == "high"
    
    def test_low_blood_pressure(self):
        """Test low BP detection."""
        assert get_vital_status("systolic", 80) == "low"
