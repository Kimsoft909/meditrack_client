"""
Date and time utility functions for API filters and report generation.
Handles timezone conversion, date range parsing, and ISO 8601 formatting.
"""

from datetime import datetime, timedelta, date
from typing import Tuple, Optional
import logging

from dateutil import parser as date_parser
import pytz

from app.core.exceptions import ValidationError

logger = logging.getLogger(__name__)

# Default timezone (UTC for all internal storage)
UTC = pytz.UTC


def parse_date_range(start_str: str, end_str: str) -> Tuple[datetime, datetime]:
    """
    Parse date range from ISO 8601 strings with timezone handling.
    
    Args:
        start_str: Start date in ISO 8601 format (YYYY-MM-DD or full datetime)
        end_str: End date in ISO 8601 format
    
    Returns:
        Tuple of (start_datetime, end_datetime) in UTC
    
    Raises:
        ValidationError: If date format is invalid or end < start
    
    Example:
        >>> start, end = parse_date_range("2024-01-01", "2024-01-31")
        >>> start.isoformat()
        '2024-01-01T00:00:00+00:00'
    """
    try:
        # Parse dates with flexible parsing
        start = date_parser.isoparse(start_str)
        end = date_parser.isoparse(end_str)
        
        # Ensure timezone aware (convert to UTC if naive)
        if start.tzinfo is None:
            start = UTC.localize(start)
        else:
            start = start.astimezone(UTC)
            
        if end.tzinfo is None:
            end = UTC.localize(end)
        else:
            end = end.astimezone(UTC)
        
        # Validate range
        if end < start:
            raise ValidationError("End date must be after start date")
        
        return start, end
        
    except (ValueError, TypeError) as e:
        logger.error(f"Invalid date format: {e}")
        raise ValidationError(f"Invalid date format. Expected ISO 8601 format: {e}")


def get_date_range_from_days(days: int, end_date: Optional[datetime] = None) -> Tuple[datetime, datetime]:
    """
    Get date range from number of days back from end_date.
    
    Args:
        days: Number of days to go back
        end_date: End date (defaults to now)
    
    Returns:
        Tuple of (start_datetime, end_datetime) in UTC
    
    Example:
        >>> start, end = get_date_range_from_days(7)
        >>> (end - start).days
        7
    """
    if end_date is None:
        end_date = datetime.now(UTC)
    elif end_date.tzinfo is None:
        end_date = UTC.localize(end_date)
    else:
        end_date = end_date.astimezone(UTC)
    
    start_date = end_date - timedelta(days=days)
    
    return start_date, end_date


def format_date_for_response(dt: datetime) -> str:
    """
    Format datetime as ISO 8601 string with timezone.
    
    Args:
        dt: Datetime to format
    
    Returns:
        ISO 8601 formatted string
    
    Example:
        >>> dt = datetime(2024, 1, 1, tzinfo=UTC)
        >>> format_date_for_response(dt)
        '2024-01-01T00:00:00+00:00'
    """
    if dt is None:
        return None
    
    if dt.tzinfo is None:
        dt = UTC.localize(dt)
    
    return dt.isoformat()


def is_within_range(dt: datetime, start: datetime, end: datetime) -> bool:
    """
    Check if datetime falls within date range.
    
    Args:
        dt: Datetime to check
        start: Range start
        end: Range end
    
    Returns:
        True if dt is within [start, end], False otherwise
    
    Example:
        >>> dt = datetime(2024, 1, 15, tzinfo=UTC)
        >>> start = datetime(2024, 1, 1, tzinfo=UTC)
        >>> end = datetime(2024, 1, 31, tzinfo=UTC)
        >>> is_within_range(dt, start, end)
        True
    """
    if dt.tzinfo is None:
        dt = UTC.localize(dt)
    if start.tzinfo is None:
        start = UTC.localize(start)
    if end.tzinfo is None:
        end = UTC.localize(end)
    
    return start <= dt <= end


def get_month_start_end(year: int, month: int) -> Tuple[datetime, datetime]:
    """
    Get first and last moment of a given month.
    
    Args:
        year: Year (e.g., 2024)
        month: Month (1-12)
    
    Returns:
        Tuple of (month_start, month_end) in UTC
    
    Example:
        >>> start, end = get_month_start_end(2024, 1)
        >>> start.day
        1
        >>> end.day
        31
    """
    # First day of month
    start = datetime(year, month, 1, 0, 0, 0, tzinfo=UTC)
    
    # Last day of month
    if month == 12:
        end = datetime(year + 1, 1, 1, 0, 0, 0, tzinfo=UTC) - timedelta(seconds=1)
    else:
        end = datetime(year, month + 1, 1, 0, 0, 0, tzinfo=UTC) - timedelta(seconds=1)
    
    return start, end


def parse_optional_date(date_str: Optional[str]) -> Optional[datetime]:
    """
    Parse optional date string, return None if not provided.
    
    Args:
        date_str: Optional ISO 8601 date string
    
    Returns:
        Parsed datetime in UTC, or None
    
    Example:
        >>> parse_optional_date("2024-01-01")
        datetime.datetime(2024, 1, 1, 0, 0, tzinfo=<UTC>)
        >>> parse_optional_date(None)
        None
    """
    if not date_str:
        return None
    
    try:
        dt = date_parser.isoparse(date_str)
        if dt.tzinfo is None:
            dt = UTC.localize(dt)
        else:
            dt = dt.astimezone(UTC)
        return dt
    except (ValueError, TypeError) as e:
        logger.error(f"Invalid date format: {e}")
        raise ValidationError(f"Invalid date format: {e}")


def get_week_start_end(date_obj: Optional[date] = None) -> Tuple[datetime, datetime]:
    """
    Get start and end of week (Monday-Sunday) for given date.
    
    Args:
        date_obj: Date to get week for (defaults to today)
    
    Returns:
        Tuple of (week_start, week_end) in UTC
    
    Example:
        >>> start, end = get_week_start_end(date(2024, 1, 15))
        >>> start.weekday()  # Monday
        0
        >>> end.weekday()  # Sunday
        6
    """
    if date_obj is None:
        date_obj = date.today()
    
    # Find Monday of the week
    days_since_monday = date_obj.weekday()
    week_start_date = date_obj - timedelta(days=days_since_monday)
    week_end_date = week_start_date + timedelta(days=6)
    
    # Convert to datetime with timezone
    week_start = datetime.combine(week_start_date, datetime.min.time()).replace(tzinfo=UTC)
    week_end = datetime.combine(week_end_date, datetime.max.time()).replace(tzinfo=UTC)
    
    return week_start, week_end
