"""
Authentication service: user registration, login, JWT management.
"""

import uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.schemas.auth import SignupRequest, TokenResponse, UserProfile
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token
)
from app.core.exceptions import AuthenticationError, ValidationError


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
