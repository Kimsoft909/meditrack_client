"""Async HuggingFace Inference API client with retry logic and rate limiting."""

import asyncio
import json
import logging
from typing import AsyncGenerator
import httpx

from app.core.config import settings
from app.core.exceptions import RateLimitError

logger = logging.getLogger(__name__)


class GrokClient:
    """HuggingFace Inference API client (keeps 'Grok' name for compatibility)."""
    
    def __init__(self):
        self.base_url = settings.GROK_API_BASE_URL
        self.api_key = settings.GROK_API_KEY
        self.model = settings.GROK_MODEL
        self.max_retries = 3
        self.timeout = settings.GROK_TIMEOUT_SECONDS
    
    async def generate_completion(
        self,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7
    ) -> str:
        """Generate non-streaming completion using HuggingFace Inference API."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(self.max_retries):
                try:
                    response = await client.post(
                        f"{self.base_url}/{self.model}",
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "inputs": prompt,
                            "parameters": {
                                "max_new_tokens": max_tokens,
                                "temperature": temperature,
                                "return_full_text": False
                            }
                        }
                    )
                    
                    # Handle HuggingFace-specific errors
                    if response.status_code == 503:
                        logger.warning(f"Model loading (cold start), attempt {attempt + 1}/{self.max_retries}")
                        if attempt < self.max_retries - 1:
                            await asyncio.sleep(5)
                            continue
                        raise Exception("Model is loading, please retry in a few seconds")
                    
                    if response.status_code == 429:
                        logger.warning(f"Rate limited, attempt {attempt + 1}/{self.max_retries}")
                        if attempt < self.max_retries - 1:
                            await asyncio.sleep(2 ** attempt)
                            continue
                        raise RateLimitError()
                    
                    if response.status_code == 403:
                        logger.error("Invalid HuggingFace API key")
                        raise Exception("Invalid HuggingFace API key - check your token")
                    
                    response.raise_for_status()
                    data = response.json()
                    
                    # HF returns array or object depending on model
                    if isinstance(data, list):
                        return data[0].get("generated_text", "")
                    else:
                        return data.get("generated_text", "")
                
                except httpx.HTTPStatusError as e:
                    if e.response.status_code == 403:
                        raise Exception("Invalid API key or insufficient quota")
                    logger.error(f"HTTP error: {e}")
                    if attempt == self.max_retries - 1:
                        raise
                    await asyncio.sleep(1)
                
                except httpx.RequestError as e:
                    logger.error(f"Request error: {e}")
                    if attempt == self.max_retries - 1:
                        raise
                    await asyncio.sleep(1)
        
        return "Unable to generate response"
    
    async def stream_completion(
        self,
        messages: list[dict],
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """Stream completion token by token using HuggingFace Inference API."""
        # Convert chat messages to single prompt (HF doesn't have native chat format)
        prompt = self._format_messages_as_prompt(messages)
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/{self.model}",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "inputs": prompt,
                        "parameters": {
                            "max_new_tokens": 1024,
                            "temperature": temperature,
                            "return_full_text": False
                        },
                        "stream": True
                    }
                ) as response:
                    if response.status_code == 503:
                        logger.warning("Model is loading (cold start)")
                        yield "Model is loading, please wait..."
                        return
                    
                    response.raise_for_status()
                    
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        
                        try:
                            chunk_json = json.loads(line)
                            if "token" in chunk_json:
                                text = chunk_json["token"].get("text", "")
                                if text:
                                    yield text
                            elif "generated_text" in chunk_json:
                                # Final chunk
                                break
                        except json.JSONDecodeError:
                            continue
            
            except Exception as e:
                logger.error(f"Streaming error: {e}")
                yield f"Error: {str(e)}"
    
    def _format_messages_as_prompt(self, messages: list[dict]) -> str:
        """Convert chat messages to single prompt for HuggingFace models."""
        formatted = ""
        for msg in messages:
            role = msg.get("role", "")
            content = msg.get("content", "")
            
            if role == "system":
                formatted += f"System: {content}\n\n"
            elif role == "user":
                formatted += f"User: {content}\n\n"
            elif role == "assistant":
                formatted += f"Assistant: {content}\n\n"
        
        formatted += "Assistant: "  # Prompt for next assistant response
        return formatted
