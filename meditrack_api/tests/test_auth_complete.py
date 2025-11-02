"""
Comprehensive authentication tests for new features.
Tests profile management, password change, avatar upload, and logout.
"""

import io
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.models.token_blacklist import TokenBlacklist
from app.core.security import hash_password


class TestProfileManagement:
    """Test user profile retrieval and updates."""

    async def test_get_profile_success(
        self, test_client: AsyncClient, test_user: User, auth_headers: dict
    ):
        """Test authenticated user can fetch their profile."""
        response = await test_client.get("/api/v1/auth/profile", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert "avatar_url" in data

    async def test_get_profile_unauthenticated(self, test_client: AsyncClient):
        """Test unauthenticated request fails."""
        response = await test_client.get("/api/v1/auth/profile")

        assert response.status_code == 401

    async def test_update_profile_full_name(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test updating full name."""
        response = await test_client.patch(
            "/api/v1/auth/profile",
            headers=auth_headers,
            json={"full_name": "Dr. John Updated"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Dr. John Updated"

    async def test_update_profile_specialty(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test updating specialty."""
        response = await test_client.patch(
            "/api/v1/auth/profile",
            headers=auth_headers,
            json={"specialty": "Neurology"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["specialty"] == "Neurology"

    async def test_update_profile_email_unique_validation(
        self,
        test_client: AsyncClient,
        test_user: User,
        auth_headers: dict,
        db_session: AsyncSession,
    ):
        """Test email change validates uniqueness."""
        # Create another user
        another_user = User(
            id="another-001",
            username="anotheruser",
            email="another@test.com",
            hashed_password=hash_password("TestPass123!"),
            full_name="Another User",
            specialty="General",
            is_active=True,
        )
        db_session.add(another_user)
        await db_session.commit()

        # Try to change email to existing one
        response = await test_client.patch(
            "/api/v1/auth/profile",
            headers=auth_headers,
            json={"email": "another@test.com"},
        )

        assert response.status_code == 422
        assert "email" in response.json()["detail"].lower()

    async def test_update_profile_partial_update(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test partial profile update only changes specified fields."""
        # Update only specialty
        response = await test_client.patch(
            "/api/v1/auth/profile",
            headers=auth_headers,
            json={"specialty": "Cardiology"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["specialty"] == "Cardiology"
        # Other fields should remain unchanged
        assert data["username"] == "testdoctor"


class TestPasswordChange:
    """Test password change functionality."""

    async def test_change_password_success(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test successful password change."""
        response = await test_client.post(
            "/api/v1/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": "TestPass123!",
                "new_password": "NewSecure456!",
                "confirm_password": "NewSecure456!",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Password changed successfully"
        assert "changed_at" in data

    async def test_change_password_wrong_current(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test password change fails with incorrect current password."""
        response = await test_client.post(
            "/api/v1/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": "WrongPassword!",
                "new_password": "NewSecure456!",
                "confirm_password": "NewSecure456!",
            },
        )

        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    async def test_change_password_mismatch_confirmation(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test password change fails when new password confirmation doesn't match."""
        response = await test_client.post(
            "/api/v1/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": "TestPass123!",
                "new_password": "NewSecure456!",
                "confirm_password": "DifferentPass789!",
            },
        )

        assert response.status_code == 422

    async def test_change_password_same_as_current(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test password change fails when new password same as current."""
        response = await test_client.post(
            "/api/v1/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": "TestPass123!",
                "new_password": "TestPass123!",
                "confirm_password": "TestPass123!",
            },
        )

        assert response.status_code == 422

    async def test_change_password_weak_new_password(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test password change fails with weak new password."""
        response = await test_client.post(
            "/api/v1/auth/change-password",
            headers=auth_headers,
            json={
                "current_password": "TestPass123!",
                "new_password": "weak",  # Too weak
                "confirm_password": "weak",
            },
        )

        assert response.status_code == 422


class TestAvatarUpload:
    """Test avatar upload functionality."""

    async def test_upload_avatar_success(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test successful avatar upload."""
        # Create fake image file
        image_content = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100  # JPEG header
        files = {"file": ("avatar.jpg", io.BytesIO(image_content), "image/jpeg")}

        response = await test_client.post(
            "/api/v1/auth/avatar", headers=auth_headers, files=files
        )

        assert response.status_code == 200
        data = response.json()
        assert "avatar_url" in data
        assert data["message"] == "Avatar uploaded successfully"
        assert data["avatar_url"].startswith("/uploads/avatars/")

    async def test_upload_avatar_invalid_type(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test avatar upload fails with invalid file type."""
        files = {"file": ("malware.exe", io.BytesIO(b"fake exe"), "application/exe")}

        response = await test_client.post(
            "/api/v1/auth/avatar", headers=auth_headers, files=files
        )

        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()

    async def test_upload_avatar_file_too_large(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test avatar upload fails when file exceeds size limit."""
        # Create file larger than 5MB
        large_content = b"\xff\xd8\xff\xe0" + b"\x00" * (6 * 1024 * 1024)  # 6MB
        files = {"file": ("large.jpg", io.BytesIO(large_content), "image/jpeg")}

        response = await test_client.post(
            "/api/v1/auth/avatar", headers=auth_headers, files=files
        )

        assert response.status_code == 400
        assert "large" in response.json()["detail"].lower()

    async def test_upload_avatar_replaces_old(
        self, test_client: AsyncClient, auth_headers: dict, db_session: AsyncSession
    ):
        """Test uploading new avatar deletes old one."""
        # Upload first avatar
        image1 = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100
        files1 = {"file": ("avatar1.jpg", io.BytesIO(image1), "image/jpeg")}

        response1 = await test_client.post(
            "/api/v1/auth/avatar", headers=auth_headers, files=files1
        )
        assert response1.status_code == 200
        old_url = response1.json()["avatar_url"]

        # Upload second avatar
        image2 = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"\x00" * 100
        files2 = {"file": ("avatar2.jpg", io.BytesIO(image2), "image/jpeg")}

        response2 = await test_client.post(
            "/api/v1/auth/avatar", headers=auth_headers, files=files2
        )
        assert response2.status_code == 200
        new_url = response2.json()["avatar_url"]

        # URLs should be different
        assert old_url != new_url


class TestLogout:
    """Test logout and token blacklisting."""

    async def test_logout_success(self, test_client: AsyncClient, test_user: User):
        """Test user can logout successfully."""
        # Login first
        login_response = await test_client.post(
            "/api/v1/auth/login",
            json={"username": "testdoctor", "password": "TestPass123!"},
        )
        assert login_response.status_code == 200

        tokens = login_response.json()
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]

        # Logout
        logout_response = await test_client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"refresh_token": refresh_token},
        )

        assert logout_response.status_code == 200
        assert "message" in logout_response.json()

    async def test_logout_blacklists_token(
        self, test_client: AsyncClient, test_user: User, db_session: AsyncSession
    ):
        """Test logout adds token to blacklist."""
        # Login
        login_response = await test_client.post(
            "/api/v1/auth/login",
            json={"username": "testdoctor", "password": "TestPass123!"},
        )
        tokens = login_response.json()
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]

        # Logout
        await test_client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"refresh_token": refresh_token},
        )

        # Check token is blacklisted
        from sqlalchemy import select

        result = await db_session.execute(
            select(TokenBlacklist).where(TokenBlacklist.token == refresh_token)
        )
        blacklisted = result.scalar_one_or_none()

        assert blacklisted is not None
        assert blacklisted.user_id == test_user.id

    async def test_blacklisted_token_cannot_refresh(
        self, test_client: AsyncClient, test_user: User
    ):
        """Test blacklisted token cannot be used to refresh."""
        # Login
        login_response = await test_client.post(
            "/api/v1/auth/login",
            json={"username": "testdoctor", "password": "TestPass123!"},
        )
        tokens = login_response.json()
        access_token = tokens["access_token"]
        refresh_token = tokens["refresh_token"]

        # Logout (blacklist token)
        await test_client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {access_token}"},
            json={"refresh_token": refresh_token},
        )

        # Try to use blacklisted token
        refresh_response = await test_client.post(
            "/api/v1/auth/refresh", json={"refresh_token": refresh_token}
        )

        assert refresh_response.status_code == 401
        assert "revoked" in refresh_response.json()["detail"].lower()

    async def test_logout_requires_authentication(self, test_client: AsyncClient):
        """Test logout requires valid authentication."""
        response = await test_client.post(
            "/api/v1/auth/logout", json={"refresh_token": "fake-token"}
        )

        assert response.status_code == 401
