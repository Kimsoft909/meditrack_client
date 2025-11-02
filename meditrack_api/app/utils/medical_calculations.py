"""Medical calculations and trend analysis utilities."""

from typing import List


def calculate_bmi(weight_kg: float, height_m: float) -> float:
    """
    Calculate Body Mass Index.
    
    Args:
        weight_kg: Weight in kilograms
        height_m: Height in meters
    
    Returns:
        BMI rounded to 2 decimal places
    
    Raises:
        ValueError: If weight or height <= 0
    
    Example:
        >>> calculate_bmi(70, 1.75)
        22.86
    """
    if weight_kg <= 0 or height_m <= 0:
        raise ValueError("Weight and height must be positive")
    return round(weight_kg / (height_m ** 2), 2)


def calculate_linear_trend(values: List[float]) -> str:
    """Calculate linear trend direction from values."""
    if len(values) < 2:
        return "stable"
    
    # Simple linear regression slope
    n = len(values)
    x_mean = sum(range(n)) / n
    y_mean = sum(values) / n
    
    numerator = sum((i - x_mean) * (values[i] - y_mean) for i in range(n))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    
    if denominator == 0:
        return "stable"
    
    slope = numerator / denominator
    
    if slope > 1:
        return "increasing"
    elif slope < -1:
        return "decreasing"
    else:
        return "stable"


def get_vital_status(vital_type: str, value: float) -> str:
    """Determine if vital sign is within normal range."""
    ranges = {
        "systolic": (90, 140),
        "diastolic": (60, 90),
        "heart_rate": (60, 100),
        "temperature": (36.1, 37.2),
        "oxygen_saturation": (95, 100),
        "respiratory_rate": (12, 20)
    }
    
    if vital_type not in ranges:
        return "normal"
    
    min_val, max_val = ranges[vital_type]
    
    if value < min_val:
        return "low"
    elif value > max_val:
        return "high"
    else:
        return "normal"


def calculate_risk_score(patient, vitals: list, medications: list) -> dict:
    """Calculate patient risk assessment."""
    risk_score = 0
    
    # Age factor
    if patient.age > 65:
        risk_score += 2
    
    # Vitals anomalies
    if vitals:
        for vital in vitals[:5]:  # Check recent 5
            if vital.blood_pressure_systolic and vital.blood_pressure_systolic > 140:
                risk_score += 1
    
    # Medication count (polypharmacy)
    active_meds = len([m for m in medications if m.is_active])
    if active_meds > 5:
        risk_score += 2
    
    # Determine risk level
    if risk_score >= 5:
        risk_level = "critical"
    elif risk_score >= 3:
        risk_level = "high"
    elif risk_score >= 1:
        risk_level = "moderate"
    else:
        risk_level = "low"
    
    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "factors": []
    }
