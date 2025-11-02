"""
Authentication endpoint tests: signup, login, token management.
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.core.security import hash_password, decode_token


class TestUserRegistration:
    """Test user signup/registration flow."""
    
    async def test_successful_registration(self, test_client: AsyncClient):
        """Test user can register with valid credentials."""
        response = await test_client.post(
            "/api/v1/auth/signup",
            json={
                "username": "newdoctor",
                "email": "new.doctor@hospital.com",
                "password": "SecurePass123!",
                "full_name": "Dr. New Doctor",
                "specialty": "Cardiology"
            }
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newdoctor"
        assert data["email"] == "new.doctor@hospital.com"
        assert data["specialty"] == "Cardiology"
        assert "id" in data
        assert "password" not in data  # Never expose password
    
    async def test_duplicate_username_rejected(self, test_client: AsyncClient, test_user: User):
        """Test registration fails with duplicate username."""
        response = await test_client.post(
            "/api/v1/auth/signup",
            json={
                "username": "testdoctor",  # Already exists
                "email": "different@hospital.com",
                "password": "SecurePass123!",
                "full_name": "Dr. Duplicate",
                "specialty": "Neurology"
            }
        )
        
        assert response.status_code == 422  # Validation error
        assert "username" in response.json()["detail"].lower()
    
    async def test_duplicate_email_rejected(self, test_client: AsyncClient, test_user: User):
        """Test registration fails with duplicate email."""
        response = await test_client.post(
            "/api/v1/auth/signup",
            json={
                "username": "anotherdoctor",
                "email": "doctor@test.com",  # Already exists
                "password": "SecurePass123!",
                "full_name": "Dr. Another",
                "specialty": "Oncology"
            }
        )
        
        assert response.status_code == 422
        assert "email" in response.json()["detail"].lower()
    
    async def test_weak_password_rejected(self, test_client: AsyncClient):
        """Test registration fails with weak password."""
        response = await test_client.post(
            "/api/v1/auth/signup",
            json={
                "username": "weakpassuser",
                "email": "weak@hospital.com",
                "password": "123",  # Too weak
                "full_name": "Dr. Weak",
                "specialty": "General Practice"
            }
        )
        
        assert response.status_code == 422


class TestUserLogin:
    """Test login authentication flow."""
    
    async def test_successful_login(self, test_client: AsyncClient, test_user: User):
        """Test user can login with valid credentials."""
        response = await test_client.post(
            "/api/v1/auth/login",
            json={
                "username": "testdoctor",
                "password": "TestPass123!"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check token structure
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"
        
        # Check user profile
        assert data["user"]["username"] == "testdoctor"
        assert data["user"]["email"] == "doctor@test.com"
    
    async def test_invalid_username(self, test_client: AsyncClient):
        """Test login fails with non-existent username."""
        response = await test_client.post(
            "/api/v1/auth/login",
            json={
                "username": "nonexistent",
                "password": "SomePass123!"
            }
        )
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    async def test_invalid_password(self, test_client: AsyncClient, test_user: User):
        """Test login fails with wrong password."""
        response = await test_client.post(
            "/api/v1/auth/login",
            json={
                "username": "testdoctor",
                "password": "WrongPassword!"
            }
        )
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    async def test_inactive_user_cannot_login(self, test_client: AsyncClient, db_session: AsyncSession):
        """Test inactive users cannot login."""
        # Create inactive user
        inactive_user = User(
            id="inactive-001",
            username="inactiveuser",
            email="inactive@test.com",
            hashed_password=hash_password("TestPass123!"),
            full_name="Inactive User",
            specialty="General",
            is_active=False
        )
        db_session.add(inactive_user)
        await db_session.commit()
        
        response = await test_client.post(
            "/api/v1/auth/login",
            json={
                "username": "inactiveuser",
                "password": "TestPass123!"
            }
        )
        
        assert response.status_code == 401
        assert "inactive" in response.json()["detail"].lower()


class TestJWTTokens:
    """Test JWT token generation and validation."""
    
    async def test_access_token_valid_structure(self, test_client: AsyncClient, test_user: User):
        """Test access token has correct structure and claims."""
        response = await test_client.post(
            "/api/v1/auth/login",
            json={"username": "testdoctor", "password": "TestPass123!"}
        )
        
        access_token = response.json()["access_token"]
        
        # Decode and verify
        payload = decode_token(access_token)
        assert payload["sub"] == test_user.id
        assert payload["username"] == test_user.username
        assert payload["type"] == "access"
        assert "exp" in payload
    
    async def test_refresh_token_valid_structure(self, test_client: AsyncClient, test_user: User):
        """Test refresh token has correct structure."""
        response = await test_client.post(
            "/api/v1/auth/login",
            json={"username": "testdoctor", "password": "TestPass123!"}
        )
        
        refresh_token = response.json()["refresh_token"]
        
        # Decode and verify
        payload = decode_token(refresh_token)
        assert payload["sub"] == test_user.id
        assert payload["type"] == "refresh"
        assert "exp" in payload
    
    async def test_token_refresh_flow(self, test_client: AsyncClient, test_user: User):
        """Test refresh token can generate new access token."""
        # Get initial tokens
        login_response = await test_client.post(
            "/api/v1/auth/login",
            json={"username": "testdoctor", "password": "TestPass123!"}
        )
        refresh_token = login_response.json()["refresh_token"]
        
        # Use refresh token to get new access token
        refresh_response = await test_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        assert refresh_response.status_code == 200
        new_data = refresh_response.json()
        assert "access_token" in new_data
        assert "refresh_token" in new_data
        
        # Verify new tokens are different
        assert new_data["access_token"] != login_response.json()["access_token"]
    
    async def test_invalid_token_rejected(self, test_client: AsyncClient):
        """Test invalid tokens are rejected."""
        response = await test_client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid.token.here"}
        )
        
        assert response.status_code == 401


class TestPasswordSecurity:
    """Test password hashing and security."""
    
    async def test_password_is_hashed(self, db_session: AsyncSession, test_user: User):
        """Test passwords are stored hashed, never plaintext."""
        assert test_user.hashed_password != "TestPass123!"
        assert test_user.hashed_password.startswith("$2b$")  # bcrypt hash
    
    async def test_same_password_different_hashes(self):
        """Test same password produces different hashes (salt)."""
        from app.core.security import hash_password
        
        hash1 = hash_password("TestPass123!")
        hash2 = hash_password("TestPass123!")
        
        # Same password, different hashes due to salt
        assert hash1 != hash2


class TestLogout:
    """Test logout endpoint."""
    
    async def test_logout_success(self, test_client: AsyncClient):
        """Test logout returns success message."""
        response = await test_client.post("/api/v1/auth/logout")
        
        assert response.status_code == 200
        assert "message" in response.json()
