"""
Authentication endpoints: login, signup, token refresh.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.auth import (
    LoginRequest,
    SignupRequest,
    TokenResponse,
    UserProfile
)
from app.services.auth_service import AuthService


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
async def signup(
    request: SignupRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Register new user account.
    
    Validates:
    - Username uniqueness
    - Email format and uniqueness
    - Password strength (min 8 chars, uppercase, lowercase, digit)
    - Medical specialty enum
    """
    service = AuthService(db)
    user = await service.register_user(request)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return access/refresh tokens.
    
    Returns:
        - access_token: Short-lived JWT (30 min)
        - refresh_token: Long-lived JWT (7 days)
        - token_type: "bearer"
        - user: User profile
    """
    service = AuthService(db)
    tokens = await service.authenticate(request.username, request.password)
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """Generate new access token using refresh token."""
    service = AuthService(db)
    return await service.refresh_access_token(refresh_token)


@router.post("/logout")
async def logout():
    """Logout user (client-side token removal)."""
    return {"message": "Logged out successfully"}
