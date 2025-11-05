"""
Authentication endpoints: login, signup, token refresh, profile management.
"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_active_user
from app.core.database import get_db
from app.core.storage import save_avatar
from app.models.user import User
from app.schemas.auth import (
    AvatarUploadResponse,
    LoginRequest,
    PasswordChangeRequest,
    PasswordChangeResponse,
    ProfileUpdateRequest,
    RefreshTokenRequest,
    SignupRequest,
    TokenResponse,
    UserProfile,
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
    request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate new access token using refresh token."""
    service = AuthService(db)
    return await service.refresh_access_token(request.refresh_token)


@router.post("/logout")
async def logout(
    refresh_token: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Logout user by blacklisting refresh token.

    This ensures the token cannot be reused even if stolen.
    """
    service = AuthService(db)
    return await service.logout(refresh_token, current_user.id)


@router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_active_user)):
    """
    Get authenticated user's profile.

    Returns complete user profile including avatar URL.
    """
    return UserProfile.model_validate(current_user)


@router.patch("/profile", response_model=UserProfile)
async def update_profile(
    updates: ProfileUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update user profile information.

    Allows updating: full_name, specialty, email.
    Email changes require uniqueness validation.
    """
    service = AuthService(db)
    return await service.update_profile(current_user.id, updates)


@router.post("/change-password", response_model=PasswordChangeResponse)
async def change_password(
    request: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Change user password.

    Requires current password verification for security.
    New password must meet strength requirements.
    """
    service = AuthService(db)
    return await service.change_password(current_user.id, request)


@router.post("/avatar", response_model=AvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload user avatar image.

    Accepts: JPG, JPEG, PNG, WEBP
    Max size: 5MB
    Automatically deletes old avatar when replacing.
    """
    try:
        # Save file
        avatar_url = await save_avatar(file, current_user.id)

        # Update user
        service = AuthService(db)
        await service.update_avatar(current_user.id, avatar_url)

        return AvatarUploadResponse(
            avatar_url=avatar_url, message="Avatar uploaded successfully"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
