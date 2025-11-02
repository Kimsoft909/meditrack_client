"""
Server-Sent Events (SSE) streaming utilities for real-time AI responses.
Enables token-by-token streaming for chat and analysis generation.
"""

import json
import logging
from typing import AsyncGenerator, Dict, Any

from fastapi.responses import StreamingResponse

from app.ai.grok_client import GrokClient
from app.ai.response_parser import sanitize_ai_output

logger = logging.getLogger(__name__)


async def stream_chat_response(
    grok_client: GrokClient,
    messages: list[dict],
    temperature: float = 0.7
) -> AsyncGenerator[str, None]:
    """
    Stream AI chat responses as Server-Sent Events.
    
    Yields SSE-formatted chunks that can be consumed by EventSource on frontend.
    Format: data: {"token": "Hello", "done": false}\\n\\n
    
    Args:
        grok_client: Grok AI client instance
        messages: Chat history (list of {"role": "user/assistant", "content": "..."})
        temperature: Sampling temperature (0.0-1.0)
    
    Yields:
        SSE-formatted data chunks
    
    Example:
        >>> async for chunk in stream_chat_response(grok, messages):
        ...     print(chunk)
        data: {"token": "Hello", "done": false}
        
        data: {"token": " there", "done": false}
        
        data: {"done": true}
    """
    try:
        async for token in grok_client.stream_completion(messages, temperature):
            # Sanitize token (remove control characters)
            sanitized_token = sanitize_ai_output(token, max_length=1000)
            
            # Format as SSE
            data = json.dumps({
                "token": sanitized_token,
                "done": False
            })
            yield f"data: {data}\n\n"
        
        # Send completion marker
        yield f"data: {json.dumps({'done': True})}\n\n"
    
    except Exception as e:
        logger.error(f"Streaming error: {e}")
        # Send error to client
        error_data = json.dumps({
            "error": str(e),
            "done": True
        })
        yield f"data: {error_data}\n\n"


async def stream_analysis_generation(
    grok_client: GrokClient,
    prompt: str,
    max_tokens: int = 2048
) -> AsyncGenerator[str, None]:
    """
    Stream AI analysis generation with progress updates.
    
    Similar to chat streaming but optimized for long-form analysis.
    
    Args:
        grok_client: Grok AI client instance
        prompt: Analysis prompt
        max_tokens: Maximum tokens to generate
    
    Yields:
        SSE-formatted data chunks with analysis fragments
    
    Example:
        >>> async for chunk in stream_analysis_generation(grok, prompt):
        ...     print(chunk)
        data: {"section": "summary", "text": "Patient presents...", "done": false}
    """
    try:
        # Track current section for better UX
        current_section = "summary"
        accumulated_text = ""
        
        messages = [{"role": "user", "content": prompt}]
        
        async for token in grok_client.stream_completion(messages, temperature=0.5):
            accumulated_text += token
            
            # Detect section changes (simplified)
            if "##" in token or "**Risk" in accumulated_text:
                if "Risk" in accumulated_text:
                    current_section = "risk_assessment"
                elif "Recommend" in accumulated_text:
                    current_section = "recommendations"
            
            data = json.dumps({
                "section": current_section,
                "text": token,
                "done": False
            })
            yield f"data: {data}\n\n"
        
        yield f"data: {json.dumps({'done': True})}\n\n"
    
    except Exception as e:
        logger.error(f"Analysis streaming error: {e}")
        error_data = json.dumps({
            "error": str(e),
            "done": True
        })
        yield f"data: {error_data}\n\n"


def create_sse_response(generator: AsyncGenerator) -> StreamingResponse:
    """
    Wrap async generator in FastAPI StreamingResponse with proper SSE headers.
    
    Args:
        generator: Async generator yielding SSE-formatted strings
    
    Returns:
        StreamingResponse configured for SSE
    
    Example:
        >>> generator = stream_chat_response(grok, messages)
        >>> return create_sse_response(generator)
    """
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


async def stream_with_heartbeat(
    generator: AsyncGenerator[str, None],
    heartbeat_interval: int = 15
) -> AsyncGenerator[str, None]:
    """
    Wrap generator with periodic heartbeat comments to keep connection alive.
    
    Some proxies close idle connections. This sends comment lines periodically.
    
    Args:
        generator: Original SSE generator
        heartbeat_interval: Seconds between heartbeats
    
    Yields:
        SSE chunks with interspersed heartbeats
    
    Example:
        >>> base_stream = stream_chat_response(grok, messages)
        >>> heartbeat_stream = stream_with_heartbeat(base_stream)
        >>> return create_sse_response(heartbeat_stream)
    """
    import asyncio
    
    last_data_time = asyncio.get_event_loop().time()
    
    async for chunk in generator:
        yield chunk
        last_data_time = asyncio.get_event_loop().time()
    
    # Send heartbeat if no data for interval
    while True:
        current_time = asyncio.get_event_loop().time()
        if current_time - last_data_time >= heartbeat_interval:
            yield ": heartbeat\n\n"
            last_data_time = current_time
        
        await asyncio.sleep(1)


async def stream_with_progress(
    generator: AsyncGenerator[str, None],
    total_steps: int = 5
) -> AsyncGenerator[str, None]:
    """
    Enhance stream with progress indicators.
    
    Useful for multi-step processes (e.g., analysis generation with multiple sections).
    
    Args:
        generator: Base generator
        total_steps: Total steps in process
    
    Yields:
        SSE chunks with progress metadata
    
    Example:
        >>> data: {"token": "...", "progress": 40, "step": 2, "total_steps": 5}
    """
    step = 0
    
    async for chunk in generator:
        try:
            data = json.loads(chunk.split("data: ")[1])
            
            if not data.get("done", False):
                step += 1
                progress = min(int((step / total_steps) * 100), 99)
                
                data["progress"] = progress
                data["step"] = step
                data["total_steps"] = total_steps
                
                yield f"data: {json.dumps(data)}\n\n"
            else:
                # Final chunk
                data["progress"] = 100
                yield f"data: {json.dumps(data)}\n\n"
        
        except (json.JSONDecodeError, IndexError):
            # Pass through non-JSON chunks
            yield chunk


def format_sse_data(data: Dict[str, Any]) -> str:
    """
    Format dictionary as SSE data line.
    
    Args:
        data: Dictionary to send
    
    Returns:
        SSE-formatted string
    
    Example:
        >>> format_sse_data({"token": "Hello", "done": False})
        'data: {"token": "Hello", "done": false}\\n\\n'
    """
    json_str = json.dumps(data)
    return f"data: {json_str}\n\n"


def format_sse_comment(comment: str) -> str:
    """
    Format comment line (for heartbeats, debugging).
    
    Args:
        comment: Comment text
    
    Returns:
        SSE comment line
    
    Example:
        >>> format_sse_comment("heartbeat")
        ': heartbeat\\n\\n'
    """
    return f": {comment}\n\n"
