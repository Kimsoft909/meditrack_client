"""User settings schemas."""

from typing import Any, Dict, Optional

from pydantic import BaseModel


class UserSettingsUpdate(BaseModel):
    """Update user settings request."""

    theme: Optional[str] = None
    font_family: Optional[str] = None
    font_size: Optional[str] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    critical_alerts_only: Optional[bool] = None
    dashboard_layout: Optional[Dict[str, Any]] = None


class NotificationPreferences(BaseModel):
    """Notification preferences."""

    email_notifications: bool
    push_notifications: bool
    critical_alerts_only: bool


class UserSettingsResponse(BaseModel):
    """User settings response."""

    theme: str
    font_family: str
    font_size: str
    email_notifications: bool
    push_notifications: bool
    critical_alerts_only: bool
    dashboard_layout: Optional[Dict[str, Any]]

    model_config = {"from_attributes": True}
