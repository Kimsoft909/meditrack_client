"""
User settings management service.
"""

import uuid
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user_settings import UserSettings
from app.models.user import User
from app.schemas.settings import (
    UserSettingsResponse,
    UserSettingsUpdate,
    NotificationPreferences
)
from app.core.exceptions import ResourceNotFoundError


class SettingsService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_settings(self, user_id: str) -> UserSettingsResponse:
        """Get user settings, create defaults if not exists."""
        result = await self.db.execute(
            select(UserSettings).where(UserSettings.user_id == user_id)
        )
        settings = result.scalar_one_or_none()
        
        if not settings:
            # Create default settings
            settings = UserSettings(
                id=str(uuid.uuid4()),
                user_id=user_id,
                theme="system",
                email_notifications=True,
                push_notifications=True,
                critical_alerts_only=False,
                font_family="Inter",
                font_size="medium"
            )
            self.db.add(settings)
            await self.db.commit()
            await self.db.refresh(settings)
        
        return UserSettingsResponse.model_validate(settings)
    
    async def update_settings(
        self,
        user_id: str,
        updates: UserSettingsUpdate
    ) -> UserSettingsResponse:
        """Update user settings."""
        result = await self.db.execute(
            select(UserSettings).where(UserSettings.user_id == user_id)
        )
        settings = result.scalar_one_or_none()
        
        if not settings:
            settings = await self.get_settings(user_id)
        
        update_data = updates.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
        
        settings.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(settings)
        
        return UserSettingsResponse.model_validate(settings)
    
    async def get_notification_preferences(self, user_id: str) -> NotificationPreferences:
        """Get notification preferences."""
        settings = await self.get_settings(user_id)
        
        return NotificationPreferences(
            email_notifications=settings.email_notifications,
            push_notifications=settings.push_notifications,
            critical_alerts_only=settings.critical_alerts_only
        )
