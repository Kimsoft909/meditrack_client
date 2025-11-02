"""
User settings endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.settings import (
    UserSettingsResponse,
    UserSettingsUpdate,
    NotificationPreferences
)
from app.services.settings_service import SettingsService
from app.models.user import User


router = APIRouter(prefix="/settings", tags=["Settings"])


@router.get("", response_model=UserSettingsResponse)
async def get_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user settings."""
    service = SettingsService(db)
    return await service.get_settings(current_user.id)


@router.patch("", response_model=UserSettingsResponse)
async def update_settings(
    updates: UserSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update user settings."""
    service = SettingsService(db)
    return await service.update_settings(current_user.id, updates)


@router.get("/notifications", response_model=NotificationPreferences)
async def get_notification_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get notification preferences."""
    service = SettingsService(db)
    return await service.get_notification_preferences(current_user.id)
