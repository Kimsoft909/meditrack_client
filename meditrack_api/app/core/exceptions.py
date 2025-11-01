"""
Custom exception classes for domain-specific errors.
"""

from fastapi import HTTPException, status


class AuthenticationError(HTTPException):
    """Raised when authentication fails."""

    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(HTTPException):
    """Raised when user lacks permission."""

    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class ResourceNotFoundError(HTTPException):
    """Raised when requested resource doesn't exist."""

    def __init__(self, resource: str, identifier: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} with identifier '{identifier}' not found",
        )


class ValidationError(HTTPException):
    """Raised for business logic validation failures."""

    def __init__(self, detail: str):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class RateLimitError(HTTPException):
    """Raised when rate limit is exceeded."""

    def __init__(self):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
        )
