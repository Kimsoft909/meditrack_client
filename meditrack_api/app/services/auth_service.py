"""
Authentication service: user registration, login, JWT management.
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AuthenticationError, ResourceNotFoundError, ValidationError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.token_blacklist import TokenBlacklist
from app.models.user import User
from app.schemas.auth import (
    PasswordChangeRequest,
    PasswordChangeResponse,
    ProfileUpdateRequest,
    SignupRequest,
    TokenResponse,
    UserProfile,
)


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def register_user(self, request: SignupRequest) -> UserProfile:
        """
        Register new user with validation.
        
        Validates:
        - Username uniqueness
        - Email uniqueness
        - Password strength (handled by Pydantic schema)
        """
        # Check username uniqueness
        result = await self.db.execute(
            select(User).where(User.username == request.username)
        )
        if result.scalar_one_or_none():
            raise ValidationError("Username already exists")
        
        # Check email uniqueness
        result = await self.db.execute(
            select(User).where(User.email == request.email)
        )
        if result.scalar_one_or_none():
            raise ValidationError("Email already registered")
        
        # Create user
        user = User(
            id=str(uuid.uuid4()),
            username=request.username,
            email=request.email,
            hashed_password=hash_password(request.password),
            full_name=request.full_name,
            specialty=request.specialty,
            is_active=True,
            is_superuser=False
        )
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        return UserProfile.model_validate(user)
    
    async def authenticate(self, username: str, password: str) -> TokenResponse:
        """
        Authenticate user and generate JWT tokens.
        
        Returns:
            TokenResponse with access_token, refresh_token, and user profile
        
        Raises:
            AuthenticationError: If credentials are invalid
        """
        # Find user
        result = await self.db.execute(
            select(User).where(User.username == username)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise AuthenticationError("Invalid username or password")
        
        # Verify password
        if not verify_password(password, user.hashed_password):
            raise AuthenticationError("Invalid username or password")
        
        # Check if user is active
        if not user.is_active:
            raise AuthenticationError("Account is inactive")
        
        # Update last login
        user.last_login = datetime.utcnow()
        await self.db.commit()
        
        # Generate tokens
        token_data = {"sub": user.id, "username": user.username}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            user=UserProfile.model_validate(user)
        )
    
    async def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """
        Generate new access token from refresh token.
        
        Raises:
            AuthenticationError: If refresh token is invalid or expired
        """
        # Decode refresh token
        payload = decode_token(refresh_token)
        
        # Validate token type
        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")
        
        # Get user
        user_id = payload.get("sub")
        result = await self.db.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user or not user.is_active:
            raise AuthenticationError("Invalid or inactive user")
        
        # Generate new tokens
        token_data = {"sub": user.id, "username": user.username}
        new_access_token = create_access_token(token_data)
        new_refresh_token = create_refresh_token(token_data)
        
        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            token_type="bearer",
            user=UserProfile.model_validate(user)
        )

    async def logout(self, refresh_token: str, user_id: str) -> dict:
        """
        Logout user by blacklisting refresh token.

        Args:
            refresh_token: JWT refresh token to blacklist
            user_id: User ID

        Returns:
            Success message
        """
        # Decode token to get expiration
        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise AuthenticationError("Invalid token type")

        # Extract expiration
        exp_timestamp = payload.get("exp")
        if not exp_timestamp:
            raise AuthenticationError("Token missing expiration")

        expires_at = datetime.utcfromtimestamp(exp_timestamp)

        # Add to blacklist
        blacklist_entry = TokenBlacklist(
            id=str(uuid.uuid4()),
            token=refresh_token,
            user_id=user_id,
            expires_at=expires_at,
        )

        self.db.add(blacklist_entry)
        await self.db.commit()

        return {"message": "Logged out successfully"}

    async def is_token_blacklisted(self, token: str) -> bool:
        """
        Check if token is blacklisted.

        Args:
            token: JWT token to check

        Returns:
            True if token is blacklisted
        """
        result = await self.db.execute(
            select(TokenBlacklist).where(TokenBlacklist.token == token)
        )
        return result.scalar_one_or_none() is not None

    async def change_password(
        self, user_id: str, request: PasswordChangeRequest
    ) -> PasswordChangeResponse:
        """
        Change user password after verifying current password.

        Args:
            user_id: User ID
            request: Password change request with current and new passwords

        Returns:
            Password change confirmation

        Raises:
            ResourceNotFoundError: If user not found
            AuthenticationError: If current password is incorrect
        """
        # Get user
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise ResourceNotFoundError("User", user_id)

        # Verify current password
        if not verify_password(request.current_password, user.hashed_password):
            raise AuthenticationError("Current password is incorrect")

        # Hash and update new password
        user.hashed_password = hash_password(request.new_password)
        user.updated_at = datetime.utcnow()

        await self.db.commit()

        return PasswordChangeResponse(
            message="Password changed successfully", changed_at=user.updated_at
        )

    async def update_profile(
        self, user_id: str, updates: ProfileUpdateRequest
    ) -> UserProfile:
        """
        Update user profile information.

        Args:
            user_id: User ID
            updates: Profile fields to update

        Returns:
            Updated user profile

        Raises:
            ResourceNotFoundError: If user not found
            ValidationError: If email already in use
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise ResourceNotFoundError("User", user_id)

        # Check email uniqueness if changing
        if updates.email and updates.email != user.email:
            existing = await self.db.execute(
                select(User).where(User.email == updates.email)
            )
            if existing.scalar_one_or_none():
                raise ValidationError("Email already in use")

        # Apply updates
        update_data = updates.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        user.updated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(user)

        return UserProfile.model_validate(user)

    async def update_avatar(self, user_id: str, avatar_url: str) -> UserProfile:
        """
        Update user avatar URL.

        Args:
            user_id: User ID
            avatar_url: New avatar URL

        Returns:
            Updated user profile

        Raises:
            ResourceNotFoundError: If user not found
        """
        result = await self.db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()

        if not user:
            raise ResourceNotFoundError("User", user_id)

        # Delete old avatar if exists
        if user.avatar_url:
            from app.core.storage import delete_avatar

            await delete_avatar(user.avatar_url)

        user.avatar_url = avatar_url
        user.updated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(user)

        return UserProfile.model_validate(user)
