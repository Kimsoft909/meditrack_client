"""Validation utility tests."""

import pytest
from datetime import date
from app.utils.validators import (
    validate_phone_number, validate_blood_type, validate_date_not_future,
    validate_vital_ranges, validate_medication_dosage
)
from app.core.exceptions import ValidationError

class TestPhoneValidation:
    def test_valid_phone_number(self):
        """Test valid phone number passes."""
        assert validate_phone_number("+12025551234") == "12025551234"
    
    def test_invalid_phone_number(self):
        """Test invalid phone raises error."""
        with pytest.raises(ValidationError):
            validate_phone_number("invalid")

class TestBloodTypeValidation:
    def test_valid_blood_type(self):
        """Test valid blood type."""
        assert validate_blood_type("A+") == "A+"
    
    def test_invalid_blood_type(self):
        """Test invalid blood type raises error."""
        with pytest.raises(ValidationError):
            validate_blood_type("X+")

class TestVitalRanges:
    def test_normal_heart_rate(self):
        """Test normal heart rate passes."""
        assert validate_vital_ranges("heart_rate", 75.0) == 75.0
    
    def test_implausible_heart_rate(self):
        """Test implausible heart rate fails."""
        with pytest.raises(ValidationError):
            validate_vital_ranges("heart_rate", 300.0)
