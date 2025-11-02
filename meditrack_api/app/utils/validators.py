"""
Custom Pydantic validators for domain-specific business rules.
Used across schemas for consistent validation.
"""

import re
from datetime import date, datetime
from typing import Optional
import logging

from app.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

# Valid blood types
VALID_BLOOD_TYPES = {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}

# International phone regex (basic validation)
PHONE_REGEX = re.compile(r"^\+?[1-9]\d{1,14}$")

# Medication dosage regex (e.g., "500mg", "10ml", "2.5g")
DOSAGE_REGEX = re.compile(r"^\d+(\.\d+)?(mg|g|ml|mcg|units?)$", re.IGNORECASE)


def validate_phone_number(v: Optional[str]) -> Optional[str]:
    """
    Validate phone number format (international format preferred).
    
    Args:
        v: Phone number string
    
    Returns:
        Validated phone number
    
    Raises:
        ValidationError: If phone format is invalid
    
    Example:
        >>> validate_phone_number("+12025551234")
        '+12025551234'
        >>> validate_phone_number("555-1234")
        ValidationError: Invalid phone number format
    """
    if v is None:
        return None
    
    # Remove common separators
    cleaned = re.sub(r"[\s\-\(\)]", "", v)
    
    if not PHONE_REGEX.match(cleaned):
        raise ValidationError(
            "Invalid phone number format. Use international format (e.g., +12025551234)"
        )
    
    return cleaned


def validate_blood_type(v: Optional[str]) -> Optional[str]:
    """
    Validate blood type is one of: A+, A-, B+, B-, AB+, AB-, O+, O-.
    
    Args:
        v: Blood type string
    
    Returns:
        Validated blood type (uppercase)
    
    Raises:
        ValidationError: If blood type is invalid
    
    Example:
        >>> validate_blood_type("A+")
        'A+'
        >>> validate_blood_type("X+")
        ValidationError: Invalid blood type
    """
    if v is None:
        return None
    
    normalized = v.upper().strip()
    
    if normalized not in VALID_BLOOD_TYPES:
        raise ValidationError(
            f"Invalid blood type. Must be one of: {', '.join(sorted(VALID_BLOOD_TYPES))}"
        )
    
    return normalized


def validate_date_not_future(v: Optional[date]) -> Optional[date]:
    """
    Validate date is not in the future (for birth dates, admission dates).
    
    Args:
        v: Date to validate
    
    Returns:
        Validated date
    
    Raises:
        ValidationError: If date is in the future
    
    Example:
        >>> validate_date_not_future(date(2020, 1, 1))
        datetime.date(2020, 1, 1)
        >>> validate_date_not_future(date(2030, 1, 1))
        ValidationError: Date cannot be in the future
    """
    if v is None:
        return None
    
    today = date.today()
    
    if v > today:
        raise ValidationError("Date cannot be in the future")
    
    return v


def validate_date_range(start: date, end: Optional[date]) -> tuple[date, Optional[date]]:
    """
    Validate end date is after start date.
    
    Args:
        start: Start date
        end: End date (can be None)
    
    Returns:
        Validated (start, end) tuple
    
    Raises:
        ValidationError: If end is before start
    
    Example:
        >>> validate_date_range(date(2024, 1, 1), date(2024, 12, 31))
        (datetime.date(2024, 1, 1), datetime.date(2024, 12, 31))
        >>> validate_date_range(date(2024, 12, 31), date(2024, 1, 1))
        ValidationError: End date must be after start date
    """
    if end is None:
        return start, end
    
    if end < start:
        raise ValidationError("End date must be after start date")
    
    return start, end


def validate_vital_ranges(field: str, value: Optional[float]) -> Optional[float]:
    """
    Validate vital signs are within physiologically plausible ranges.
    
    Args:
        field: Vital sign field name
        value: Measured value
    
    Returns:
        Validated value
    
    Raises:
        ValidationError: If value is implausible
    
    Example:
        >>> validate_vital_ranges("heart_rate", 75.0)
        75.0
        >>> validate_vital_ranges("heart_rate", 300.0)
        ValidationError: Heart rate must be between 20 and 250 bpm
    """
    if value is None:
        return None
    
    # Define physiologically plausible ranges (wider than normal for edge cases)
    ranges = {
        "blood_pressure_systolic": (50, 250, "mmHg"),
        "blood_pressure_diastolic": (30, 150, "mmHg"),
        "heart_rate": (20, 250, "bpm"),
        "temperature": (30.0, 45.0, "°C"),
        "respiratory_rate": (5, 60, "breaths/min"),
        "oxygen_saturation": (50, 100, "%"),
        "glucose_level": (20, 600, "mg/dL"),
    }
    
    if field not in ranges:
        return value
    
    min_val, max_val, unit = ranges[field]
    
    if not (min_val <= value <= max_val):
        raise ValidationError(
            f"{field.replace('_', ' ').title()} must be between {min_val} and {max_val} {unit}"
        )
    
    return value


def validate_medication_dosage(v: Optional[str]) -> Optional[str]:
    """
    Validate medication dosage format.
    
    Args:
        v: Dosage string (e.g., "500mg", "10ml", "2.5g")
    
    Returns:
        Validated dosage
    
    Raises:
        ValidationError: If dosage format is invalid
    
    Example:
        >>> validate_medication_dosage("500mg")
        '500mg'
        >>> validate_medication_dosage("abc")
        ValidationError: Invalid dosage format
    """
    if v is None or v.strip() == "":
        return None
    
    if not DOSAGE_REGEX.match(v.strip()):
        raise ValidationError(
            "Invalid dosage format. Examples: '500mg', '10ml', '2.5g', '100mcg', '5units'"
        )
    
    return v.strip().lower()


def validate_risk_level_change(
    old_level: Optional[str],
    new_level: str,
    justification: Optional[str] = None
) -> str:
    """
    Validate risk level changes are reasonable.
    
    Args:
        old_level: Previous risk level
        new_level: New risk level
        justification: Reason for change (optional but recommended)
    
    Returns:
        Validated new level
    
    Raises:
        ValidationError: If change is too drastic without justification
    
    Example:
        >>> validate_risk_level_change("low", "moderate")
        'moderate'
        >>> validate_risk_level_change("low", "critical")
        ValidationError: Risk level jump from low to critical requires justification
    """
    risk_hierarchy = {"low": 0, "moderate": 1, "high": 2, "critical": 3}
    
    if old_level is None:
        return new_level
    
    old_rank = risk_hierarchy.get(old_level.lower(), 0)
    new_rank = risk_hierarchy.get(new_level.lower(), 0)
    
    # If jumping more than 1 level, require justification
    if abs(new_rank - old_rank) > 1 and not justification:
        raise ValidationError(
            f"Risk level jump from {old_level} to {new_level} requires justification"
        )
    
    return new_level


def validate_age_from_dob(dob: date) -> int:
    """
    Calculate and validate age from date of birth.
    
    Args:
        dob: Date of birth
    
    Returns:
        Age in years
    
    Raises:
        ValidationError: If DOB results in implausible age
    
    Example:
        >>> validate_age_from_dob(date(2000, 1, 1))
        24
    """
    today = date.today()
    age = today.year - dob.year
    
    # Adjust if birthday hasn't occurred this year
    if today.month < dob.month or (today.month == dob.month and today.day < dob.day):
        age -= 1
    
    if age < 0 or age > 150:
        raise ValidationError(f"Implausible age ({age}) calculated from date of birth")
    
    return age


def validate_email_format(v: Optional[str]) -> Optional[str]:
    """
    Basic email format validation.
    
    Args:
        v: Email string
    
    Returns:
        Validated email (lowercase)
    
    Raises:
        ValidationError: If email format is invalid
    
    Example:
        >>> validate_email_format("user@example.com")
        'user@example.com'
        >>> validate_email_format("invalid")
        ValidationError: Invalid email format
    """
    if v is None or v.strip() == "":
        return None
    
    email_regex = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    
    cleaned = v.strip().lower()
    
    if not email_regex.match(cleaned):
        raise ValidationError("Invalid email format")
    
    return cleaned
