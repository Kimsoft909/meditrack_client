"""
AI chat conversation history.
"""

import uuid

from sqlalchemy import Column, ForeignKey, Index, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import TimestampMixin


class ChatMessage(Base, TimestampMixin):
    """Chat message history for AI assistant."""

    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)

    # Conversation tracking
    conversation_id = Column(String, nullable=True, index=True)

    # Relationships
    user = relationship("User", back_populates="chat_messages")

    __table_args__ = (
        Index("idx_chat_user_created", "user_id", "created_at"),
        Index("idx_chat_conversation", "conversation_id", "created_at"),
    )

    def __repr__(self):
        return f"<ChatMessage {self.role} by {self.user_id}>"
