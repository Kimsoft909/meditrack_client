"""Chat schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ChatMessageRequest(BaseModel):
    """Send chat message request."""

    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    """Chat message response."""

    id: str
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
