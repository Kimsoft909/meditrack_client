"""
AI chat service with conversation context management.
"""

import json
import uuid
from typing import AsyncGenerator, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.chat_message import ChatMessage
from app.schemas.chat import ChatResponse
from app.ai.grok_client import GrokClient
from app.ai.prompts import MEDICAL_ASSISTANT_SYSTEM_PROMPT


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.grok = GrokClient()
    
    async def stream_chat_response(
        self,
        user_id: str,
        message: str,
        conversation_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Stream chat response token by token."""
        # Generate conversation ID if not provided
        if not conversation_id:
            conversation_id = str(uuid.uuid4())
        
        # Retrieve conversation history
        history_query = select(ChatMessage).where(
            ChatMessage.user_id == user_id,
            ChatMessage.conversation_id == conversation_id
        ).order_by(ChatMessage.created_at.desc()).limit(10)
        
        history_result = await self.db.execute(history_query)
        history = list(history_result.scalars().all())
        history.reverse()  # Chronological order
        
        # Build message context
        messages = [{"role": "system", "content": MEDICAL_ASSISTANT_SYSTEM_PROMPT}]
        for msg in history:
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": message})
        
        # Save user message
        user_msg = ChatMessage(
            id=str(uuid.uuid4()),
            user_id=user_id,
            role="user",
            content=message,
            conversation_id=conversation_id
        )
        self.db.add(user_msg)
        await self.db.commit()
        
        # Stream response
        assistant_response = ""
        try:
            async for chunk in self.grok.stream_completion(messages):
                assistant_response += chunk
                # Escape quotes for JSON
                escaped_chunk = chunk.replace('"', '\\"')
                yield json.dumps({"type": "token", "content": escaped_chunk})
        except Exception as e:
            yield json.dumps({"type": "error", "content": str(e)})
            return
        
        # Save assistant response
        assistant_msg = ChatMessage(
            id=str(uuid.uuid4()),
            user_id=user_id,
            role="assistant",
            content=assistant_response,
            conversation_id=conversation_id
        )
        self.db.add(assistant_msg)
        await self.db.commit()
        
        yield json.dumps({"type": "done", "conversation_id": conversation_id})
    
    async def get_chat_history(
        self,
        user_id: str,
        limit: int = 50,
        conversation_id: Optional[str] = None
    ) -> List[ChatResponse]:
        """Get user's chat history."""
        query = select(ChatMessage).where(ChatMessage.user_id == user_id)
        
        if conversation_id:
            query = query.where(ChatMessage.conversation_id == conversation_id)
        
        query = query.order_by(ChatMessage.created_at.desc()).limit(limit)
        
        result = await self.db.execute(query)
        messages = list(result.scalars().all())
        messages.reverse()  # Return in chronological order
        
        return [ChatResponse.model_validate(m) for m in messages]
    
    async def delete_conversation(self, user_id: str, conversation_id: str) -> None:
        """Delete conversation history."""
        await self.db.execute(
            delete(ChatMessage).where(
                ChatMessage.user_id == user_id,
                ChatMessage.conversation_id == conversation_id
            )
        )
        await self.db.commit()
