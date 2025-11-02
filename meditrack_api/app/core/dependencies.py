"""
FastAPI dependency injection helpers.
"""

from typing import Optional

from fastapi import Depends, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import AuthenticationError
from app.core.security import decode_token
from app.models.user import User


async def get_current_user(
    authorization: Optional[str] = Header(None), db: AsyncSession = Depends(get_db)
) -> User:
    """
    Extract and validate JWT token from Authorization header.
    Returns authenticated user or raises AuthenticationError.

    Also checks if token is blacklisted (logged out).
    """
    if not authorization:
        raise AuthenticationError(detail="Authorization header missing")

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise AuthenticationError(detail="Invalid authentication scheme")
    except ValueError:
        raise AuthenticationError(detail="Invalid authorization header format")

    # Decode token
    payload = decode_token(token)
    user_id = payload.get("sub")

    if not user_id:
        raise AuthenticationError(detail="Invalid token payload")

    # Check if token is blacklisted
    from app.models.token_blacklist import TokenBlacklist

    blacklist_result = await db.execute(
        select(TokenBlacklist).where(TokenBlacklist.token == token)
    )
    if blacklist_result.scalar_one_or_none():
        raise AuthenticationError(detail="Token has been revoked")

    # Fetch user from database
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise AuthenticationError(detail="User not found")

    return user


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Ensure user is active (not disabled)."""
    if not current_user.is_active:
        raise AuthenticationError(detail="User account is disabled")
    return current_user
