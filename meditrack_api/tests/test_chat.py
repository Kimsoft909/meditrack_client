"""
AI chat streaming and conversation history tests.
"""

import pytest
import json
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from unittest.mock import AsyncMock, patch

from app.models.chat_message import ChatMessage
from app.models.user import User


class TestChatStreaming:
    """Test AI chat streaming functionality."""
    
    async def test_send_message_creates_conversation(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User
    ):
        """Test sending first message creates new conversation."""
        with patch('app.ai.grok_client.GrokClient.stream_completion') as mock_stream:
            # Mock streaming response
            async def mock_generator():
                yield "Hello"
                yield " from"
                yield " AI"
            
            mock_stream.return_value = mock_generator()
            
            response = await test_client.post(
                "/api/v1/chat/send",
                headers=auth_headers,
                json={"message": "What is hypertension?"}
            )
            
            assert response.status_code == 200
            
            # Verify it's a streaming response
            content_type = response.headers.get("content-type")
            assert "text/event-stream" in content_type
    
    async def test_send_message_with_conversation_id(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test sending message to existing conversation."""
        # Create existing conversation
        conversation_id = "conv-12345"
        existing_msg = ChatMessage(
            id="msg-001",
            user_id=test_user.id,
            role="user",
            content="Previous message",
            conversation_id=conversation_id
        )
        db_session.add(existing_msg)
        await db_session.commit()
        
        with patch('app.ai.grok_client.GrokClient.stream_completion') as mock_stream:
            async def mock_generator():
                yield "Response"
            
            mock_stream.return_value = mock_generator()
            
            response = await test_client.post(
                "/api/v1/chat/send",
                headers=auth_headers,
                json={
                    "message": "Follow-up question",
                    "conversation_id": conversation_id
                }
            )
            
            assert response.status_code == 200
    
    async def test_stream_includes_conversation_context(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test streaming includes previous conversation context."""
        conversation_id = "conv-context-test"
        
        # Create conversation history
        messages = [
            ChatMessage(
                id=f"msg-{i}",
                user_id=test_user.id,
                role="user" if i % 2 == 0 else "assistant",
                content=f"Message {i}",
                conversation_id=conversation_id
            )
            for i in range(4)
        ]
        for msg in messages:
            db_session.add(msg)
        await db_session.commit()
        
        with patch('app.ai.grok_client.GrokClient.stream_completion') as mock_stream:
            async def mock_generator():
                yield "Context-aware response"
            
            mock_stream.return_value = mock_generator()
            
            response = await test_client.post(
                "/api/v1/chat/send",
                headers=auth_headers,
                json={
                    "message": "New question with context",
                    "conversation_id": conversation_id
                }
            )
            
            assert response.status_code == 200
            
            # Verify stream was called with context
            mock_stream.assert_called_once()
            call_args = mock_stream.call_args[0][0]
            assert len(call_args) >= 2  # System prompt + history
    
    async def test_streaming_error_handling(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test error handling during streaming."""
        with patch('app.ai.grok_client.GrokClient.stream_completion') as mock_stream:
            # Mock streaming error
            async def mock_error_generator():
                yield "Start"
                raise Exception("API error")
            
            mock_stream.return_value = mock_error_generator()
            
            response = await test_client.post(
                "/api/v1/chat/send",
                headers=auth_headers,
                json={"message": "Test error handling"}
            )
            
            assert response.status_code == 200  # Still returns 200, error in stream
    
    async def test_empty_message_rejected(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test empty message is rejected."""
        response = await test_client.post(
            "/api/v1/chat/send",
            headers=auth_headers,
            json={"message": ""}
        )
        
        assert response.status_code == 422
    
    async def test_message_too_long_rejected(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test message exceeding max length is rejected."""
        long_message = "a" * 2001  # Exceeds 2000 char limit
        
        response = await test_client.post(
            "/api/v1/chat/send",
            headers=auth_headers,
            json={"message": long_message}
        )
        
        assert response.status_code == 422


class TestChatHistory:
    """Test chat history retrieval."""
    
    async def test_get_chat_history(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test retrieving user's chat history."""
        # Create chat messages
        messages = [
            ChatMessage(
                id=f"msg-hist-{i}",
                user_id=test_user.id,
                role="user" if i % 2 == 0 else "assistant",
                content=f"History message {i}",
                conversation_id="conv-history-test"
            )
            for i in range(10)
        ]
        for msg in messages:
            db_session.add(msg)
        await db_session.commit()
        
        response = await test_client.get(
            "/api/v1/chat/history",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 10
    
    async def test_get_history_with_limit(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test limiting chat history results."""
        # Create 30 messages
        for i in range(30):
            msg = ChatMessage(
                id=f"msg-limit-{i}",
                user_id=test_user.id,
                role="user",
                content=f"Message {i}",
                conversation_id="conv-limit-test"
            )
            db_session.add(msg)
        await db_session.commit()
        
        response = await test_client.get(
            "/api/v1/chat/history?limit=10",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 10
    
    async def test_get_history_by_conversation(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test filtering history by conversation ID."""
        target_conv = "conv-target"
        other_conv = "conv-other"
        
        # Create messages in different conversations
        for conv_id in [target_conv, other_conv]:
            for i in range(5):
                msg = ChatMessage(
                    id=f"msg-{conv_id}-{i}",
                    user_id=test_user.id,
                    role="user",
                    content=f"Message in {conv_id}",
                    conversation_id=conv_id
                )
                db_session.add(msg)
        await db_session.commit()
        
        response = await test_client.get(
            f"/api/v1/chat/history?conversation_id={target_conv}",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        # Should only get messages from target conversation
        assert all(msg["id"].startswith(f"msg-{target_conv}") for msg in data)
    
    async def test_history_chronological_order(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test chat history is returned in chronological order."""
        messages = []
        for i in range(5):
            msg = ChatMessage(
                id=f"msg-chrono-{i}",
                user_id=test_user.id,
                role="user",
                content=f"Message {i}",
                conversation_id="conv-chrono"
            )
            db_session.add(msg)
            messages.append(msg)
        await db_session.commit()
        
        response = await test_client.get(
            "/api/v1/chat/history?conversation_id=conv-chrono",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify chronological order (oldest first)
        for i in range(len(data) - 1):
            assert data[i]["id"] == f"msg-chrono-{i}"
    
    async def test_history_isolated_by_user(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test users can only see their own chat history."""
        # Create message from current user
        user_msg = ChatMessage(
            id="msg-user",
            user_id=test_user.id,
            role="user",
            content="My message",
            conversation_id="conv-user"
        )
        db_session.add(user_msg)
        
        # Create message from different user
        other_user_msg = ChatMessage(
            id="msg-other",
            user_id="other-user-id",
            role="user",
            content="Other user's message",
            conversation_id="conv-other"
        )
        db_session.add(other_user_msg)
        await db_session.commit()
        
        response = await test_client.get(
            "/api/v1/chat/history",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should only see own messages
        message_ids = [msg["id"] for msg in data]
        assert "msg-user" in message_ids
        assert "msg-other" not in message_ids
    
    async def test_history_limit_validation(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test history limit is validated."""
        # Test limit too high
        response = await test_client.get(
            "/api/v1/chat/history?limit=300",
            headers=auth_headers
        )
        
        assert response.status_code == 422
        
        # Test limit too low
        response = await test_client.get(
            "/api/v1/chat/history?limit=0",
            headers=auth_headers
        )
        
        assert response.status_code == 422


class TestConversationDeletion:
    """Test conversation deletion."""
    
    async def test_delete_conversation(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test deleting conversation removes all messages."""
        conversation_id = "conv-to-delete"
        
        # Create messages in conversation
        for i in range(5):
            msg = ChatMessage(
                id=f"msg-delete-{i}",
                user_id=test_user.id,
                role="user",
                content=f"Message {i}",
                conversation_id=conversation_id
            )
            db_session.add(msg)
        await db_session.commit()
        
        # Delete conversation
        response = await test_client.delete(
            f"/api/v1/chat/history/{conversation_id}",
            headers=auth_headers
        )
        
        assert response.status_code == 204
        
        # Verify messages are deleted
        history_response = await test_client.get(
            f"/api/v1/chat/history?conversation_id={conversation_id}",
            headers=auth_headers
        )
        
        assert history_response.status_code == 200
        data = history_response.json()
        assert len(data) == 0
    
    async def test_delete_only_own_conversation(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test users can only delete their own conversations."""
        own_conv = "conv-own"
        other_conv = "conv-other"
        
        # Create own conversation
        own_msg = ChatMessage(
            id="msg-own",
            user_id=test_user.id,
            role="user",
            content="Own message",
            conversation_id=own_conv
        )
        db_session.add(own_msg)
        
        # Create other user's conversation
        other_msg = ChatMessage(
            id="msg-other",
            user_id="other-user-id",
            role="user",
            content="Other message",
            conversation_id=other_conv
        )
        db_session.add(other_msg)
        await db_session.commit()
        
        # Try to delete other user's conversation
        response = await test_client.delete(
            f"/api/v1/chat/history/{other_conv}",
            headers=auth_headers
        )
        
        # Should succeed (but delete nothing due to user_id check)
        assert response.status_code == 204
    
    async def test_delete_nonexistent_conversation(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test deleting non-existent conversation succeeds (idempotent)."""
        response = await test_client.delete(
            "/api/v1/chat/history/conv-nonexistent",
            headers=auth_headers
        )
        
        assert response.status_code == 204


class TestChatAuthentication:
    """Test chat authentication requirements."""
    
    async def test_send_message_requires_auth(
        self, test_client: AsyncClient
    ):
        """Test sending message requires authentication."""
        response = await test_client.post(
            "/api/v1/chat/send",
            json={"message": "Test message"}
        )
        
        assert response.status_code == 401
    
    async def test_get_history_requires_auth(
        self, test_client: AsyncClient
    ):
        """Test getting history requires authentication."""
        response = await test_client.get("/api/v1/chat/history")
        
        assert response.status_code == 401
    
    async def test_delete_conversation_requires_auth(
        self, test_client: AsyncClient
    ):
        """Test deleting conversation requires authentication."""
        response = await test_client.delete("/api/v1/chat/history/conv-123")
        
        assert response.status_code == 401


class TestChatContextManagement:
    """Test conversation context and memory management."""
    
    async def test_context_limited_to_recent_messages(
        self, test_client: AsyncClient, auth_headers: dict, test_user: User, db_session: AsyncSession
    ):
        """Test context includes only recent messages (limit 10)."""
        conversation_id = "conv-context-limit"
        
        # Create 20 messages
        for i in range(20):
            msg = ChatMessage(
                id=f"msg-ctx-{i}",
                user_id=test_user.id,
                role="user",
                content=f"Message {i}",
                conversation_id=conversation_id
            )
            db_session.add(msg)
        await db_session.commit()
        
        with patch('app.ai.grok_client.GrokClient.stream_completion') as mock_stream:
            async def mock_generator():
                yield "Response"
            
            mock_stream.return_value = mock_generator()
            
            response = await test_client.post(
                "/api/v1/chat/send",
                headers=auth_headers,
                json={
                    "message": "New message",
                    "conversation_id": conversation_id
                }
            )
            
            assert response.status_code == 200
            
            # Verify context was limited
            call_args = mock_stream.call_args[0][0]
            # Should have system prompt + 10 recent messages + new message
            assert len(call_args) <= 12
    
    async def test_system_prompt_always_included(
        self, test_client: AsyncClient, auth_headers: dict
    ):
        """Test system prompt is always first in context."""
        with patch('app.ai.grok_client.GrokClient.stream_completion') as mock_stream:
            async def mock_generator():
                yield "Response"
            
            mock_stream.return_value = mock_generator()
            
            response = await test_client.post(
                "/api/v1/chat/send",
                headers=auth_headers,
                json={"message": "Test system prompt"}
            )
            
            assert response.status_code == 200
            
            # Verify system prompt is first
            call_args = mock_stream.call_args[0][0]
            assert call_args[0]["role"] == "system"
            assert len(call_args[0]["content"]) > 0
