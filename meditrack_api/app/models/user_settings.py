"""
User preferences (theme, notifications, typography).
"""

import uuid

from sqlalchemy import Boolean, Column, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class UserSettings(Base, TimestampMixin):
    """User preferences and settings."""

    __tablename__ = "user_settings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(
        String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # UI preferences
    theme = Column(String, default="light")  # light, dark, auto
    font_family = Column(String, default="inter")
    font_size = Column(String, default="medium")

    # Notifications
    email_notifications = Column(Boolean, default=True)
    push_notifications = Column(Boolean, default=True)
    critical_alerts_only = Column(Boolean, default=False)

    # Dashboard preferences
    dashboard_layout = Column(JSON, nullable=True)

    # Relationships
    user = relationship("User", back_populates="settings")

    def __repr__(self):
        return f"<UserSettings for {self.user_id}>"
