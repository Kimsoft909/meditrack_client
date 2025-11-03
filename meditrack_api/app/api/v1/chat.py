"""
AI chat assistant with streaming support.
"""

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.schemas.chat import ChatMessageRequest, ChatResponse
from app.services.chat_service import ChatService
from app.models.user import User


router = APIRouter(prefix="/chat", tags=["AI Chat"])


@router.post("/send")
async def send_message_streaming(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Send message to AI assistant with streaming response."""
    # ChatService creates its own session for streaming
    service = ChatService(None)
    
    async def event_generator():
        async for chunk in service.stream_chat_response(
            user_id=current_user.id,
            message=request.message,
            conversation_id=request.conversation_id
        ):
            yield f"data: {chunk}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )


@router.get("/history", response_model=List[ChatResponse])
async def get_chat_history(
    limit: int = Query(50, ge=1, le=200),
    conversation_id: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get user's chat history."""
    service = ChatService(db)
    return await service.get_chat_history(current_user.id, limit, conversation_id)


@router.delete("/history/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete conversation history."""
    service = ChatService(db)
    await service.delete_conversation(current_user.id, conversation_id)
    return None
