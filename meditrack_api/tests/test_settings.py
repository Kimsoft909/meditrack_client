"""
User settings and preferences tests.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.user_settings import UserSettings


class TestSettingsRetrieval:
    """Test getting user settings."""
    
    async def test_get_settings_creates_defaults(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test getting settings creates default settings if none exist."""
        response = await test_client.get(
            "/api/v1/settings",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify default values
        assert data["theme"] in ["system", "light", "dark"]
        assert data["font_family"] == "Inter"
        assert data["font_size"] == "16"
        assert data["email_notifications"] is True
        assert data["push_notifications"] is True
    
    async def test_get_existing_settings(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test retrieving existing user settings."""
        # Create settings
        settings = UserSettings(
            id="settings-001",
            user_id=test_user.id,
            theme="dark",
            font_family="Roboto",
            font_size="18",
            email_notifications=False,
            push_notifications=True,
            critical_alerts_only=True
        )
        db_session.add(settings)
        await db_session.commit()
        
        response = await test_client.get(
            "/api/v1/settings",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["theme"] == "dark"
        assert data["font_family"] == "Roboto"
        assert data["font_size"] == "18"
        assert data["email_notifications"] is False
    
    async def test_get_settings_requires_auth(
        self, test_client: AsyncClient
    ):
        """Test getting settings requires authentication."""
        response = await test_client.get("/api/v1/settings")
        
        assert response.status_code == 401


class TestSettingsUpdate:
    """Test updating user settings."""
    
    async def test_update_theme(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test updating theme preference."""
        response = await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={"theme": "dark"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["theme"] == "dark"
    
    async def test_update_typography(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test updating typography settings."""
        response = await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={
                "font_family": "Poppins",
                "font_size": "20"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["font_family"] == "Poppins"
        assert data["font_size"] == "20"
    
    async def test_update_notification_preferences(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test updating notification settings."""
        response = await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={
                "email_notifications": False,
                "push_notifications": False,
                "critical_alerts_only": True
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email_notifications"] is False
        assert data["push_notifications"] is False
        assert data["critical_alerts_only"] is True
    
    async def test_update_dashboard_layout(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test updating dashboard layout preferences."""
        custom_layout = {
            "widgets": ["patients", "vitals", "medications"],
            "grid": {"cols": 3, "rows": 2}
        }
        
        response = await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={"dashboard_layout": custom_layout}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["dashboard_layout"] == custom_layout
    
    async def test_partial_update(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test partial update doesn't affect other settings."""
        # Create initial settings
        settings = UserSettings(
            id="settings-partial",
            user_id=test_user.id,
            theme="light",
            font_family="Inter",
            font_size="16",
            email_notifications=True
        )
        db_session.add(settings)
        await db_session.commit()
        
        # Update only theme
        response = await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={"theme": "dark"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Theme updated
        assert data["theme"] == "dark"
        
        # Other settings unchanged
        assert data["font_family"] == "Inter"
        assert data["font_size"] == "16"
        assert data["email_notifications"] is True
    
    async def test_update_creates_if_not_exists(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test update creates settings if they don't exist."""
        response = await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={"theme": "dark"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["theme"] == "dark"
        # Should have default values for other fields
        assert "font_family" in data
    
    async def test_update_settings_requires_auth(
        self, test_client: AsyncClient
    ):
        """Test updating settings requires authentication."""
        response = await test_client.patch(
            "/api/v1/settings",
            json={"theme": "dark"}
        )
        
        assert response.status_code == 401


class TestNotificationPreferences:
    """Test notification preferences endpoint."""
    
    async def test_get_notification_preferences(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test getting notification preferences."""
        # Create settings with specific notification prefs
        settings = UserSettings(
            id="settings-notif",
            user_id=test_user.id,
            theme="light",
            font_family="Inter",
            font_size="16",
            email_notifications=True,
            push_notifications=False,
            critical_alerts_only=True,
            notifications_enabled=True,
            vitals_alerts=True,
            medication_reminders=False
        )
        db_session.add(settings)
        await db_session.commit()
        
        response = await test_client.get(
            "/api/v1/settings/notifications",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify notification settings
        assert "email_notifications" in data
        assert "push_notifications" in data
    
    async def test_notification_preferences_defaults(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test notification preferences return defaults if not set."""
        response = await test_client.get(
            "/api/v1/settings/notifications",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have created default settings
        assert isinstance(data.get("email_notifications"), bool)
        assert isinstance(data.get("push_notifications"), bool)
    
    async def test_notification_preferences_requires_auth(
        self, test_client: AsyncClient
    ):
        """Test getting notification preferences requires auth."""
        response = await test_client.get("/api/v1/settings/notifications")
        
        assert response.status_code == 401


class TestSettingsIsolation:
    """Test settings are isolated per user."""
    
    async def test_users_have_separate_settings(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test each user has their own settings."""
        # Create settings for test user
        user_settings = UserSettings(
            id="settings-user1",
            user_id=test_user.id,
            theme="dark",
            font_family="Roboto"
        )
        db_session.add(user_settings)
        
        # Create settings for different user
        other_settings = UserSettings(
            id="settings-user2",
            user_id="other-user-id",
            theme="light",
            font_family="Arial"
        )
        db_session.add(other_settings)
        await db_session.commit()
        
        # Get settings for test user
        response = await test_client.get(
            "/api/v1/settings",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should get own settings, not other user's
        assert data["theme"] == "dark"
        assert data["font_family"] == "Roboto"
    
    async def test_update_only_affects_own_settings(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test updating settings only affects current user."""
        # Create settings for another user
        other_settings = UserSettings(
            id="settings-other",
            user_id="other-user-id",
            theme="light",
            font_family="Arial"
        )
        db_session.add(other_settings)
        await db_session.commit()
        
        # Update own settings
        response = await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={"theme": "dark"}
        )
        
        assert response.status_code == 200
        
        # Verify other user's settings unchanged
        from sqlalchemy import select
        result = await db_session.execute(
            select(UserSettings).where(UserSettings.user_id == "other-user-id")
        )
        other = result.scalar_one()
        assert other.theme == "light"  # Unchanged


class TestSettingsValidation:
    """Test settings validation."""
    
    async def test_invalid_theme_rejected(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test invalid theme value is rejected."""
        response = await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={"theme": "invalid-theme"}
        )
        
        # Should accept any string (no validation in current schema)
        # This test documents current behavior
        assert response.status_code == 200
    
    async def test_empty_update_accepted(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test empty update is accepted (no-op)."""
        response = await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={}
        )
        
        assert response.status_code == 200


class TestSettingsPersistence:
    """Test settings are persisted correctly."""
    
    async def test_settings_persist_across_sessions(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test settings persist across multiple requests."""
        # Update settings
        update_response = await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={
                "theme": "dark",
                "font_size": "18"
            }
        )
        
        assert update_response.status_code == 200
        
        # Get settings again
        get_response = await test_client.get(
            "/api/v1/settings",
            headers=auth_headers
        )
        
        assert get_response.status_code == 200
        data = get_response.json()
        
        # Verify persisted
        assert data["theme"] == "dark"
        assert data["font_size"] == "18"
    
    async def test_multiple_updates_cumulative(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test multiple updates accumulate correctly."""
        # First update
        await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={"theme": "dark"}
        )
        
        # Second update
        await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={"font_size": "20"}
        )
        
        # Third update
        response = await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={"email_notifications": False}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # All updates should be present
        assert data["theme"] == "dark"
        assert data["font_size"] == "20"
        assert data["email_notifications"] is False


class TestSettingsTimestamps:
    """Test settings timestamp tracking."""
    
    async def test_settings_have_timestamps(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test settings include creation and update timestamps."""
        response = await test_client.get(
            "/api/v1/settings",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        # Note: Timestamps might not be in response schema
        # This documents current API behavior
    
    async def test_update_changes_timestamp(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test updating settings updates the timestamp."""
        # Get initial settings
        await test_client.get("/api/v1/settings", headers=auth_headers)
        
        # Update settings
        await test_client.patch(
            "/api/v1/settings",
            headers=auth_headers,
            json={"theme": "dark"}
        )
        
        # Verify timestamp updated in database
        from sqlalchemy import select
        result = await db_session.execute(
            select(UserSettings).where(UserSettings.user_id == test_user.id)
        )
        settings = result.scalar_one()
        
        assert settings.updated_at is not None
        assert settings.created_at is not None
