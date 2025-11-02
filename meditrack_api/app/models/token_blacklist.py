"""
Token blacklist model for logout functionality.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String

from app.core.database import Base
from app.models.base import TimestampMixin


class TokenBlacklist(Base, TimestampMixin):
    """Blacklisted tokens (revoked on logout)."""

    __tablename__ = "token_blacklist"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    token = Column(String, unique=True, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    blacklisted_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<TokenBlacklist user_id={self.user_id}>"
