"""Authentication schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class LoginRequest(BaseModel):
    """Login request payload."""

    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)


class SignupRequest(BaseModel):
    """User registration payload."""

    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = Field(..., min_length=2, max_length=100)
    specialty: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class UserProfile(BaseModel):
    """User profile response."""

    id: str
    username: str
    email: str
    full_name: str
    specialty: Optional[str]
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PasswordChangeRequest(BaseModel):
    """Password change request payload."""

    current_password: str = Field(..., min_length=8)
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if v != info.data.get("new_password"):
            raise ValueError("Passwords do not match")
        return v

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v, info):
        if v == info.data.get("current_password"):
            raise ValueError("New password must be different from current password")

        # Password strength validation
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class PasswordChangeResponse(BaseModel):
    """Password change response."""

    message: str
    changed_at: datetime


class ProfileUpdateRequest(BaseModel):
    """Profile update request payload."""

    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    specialty: Optional[str] = None
    email: Optional[EmailStr] = None


class AvatarUploadResponse(BaseModel):
    """Avatar upload response."""

    avatar_url: str
    message: str


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserProfile
