"""Async HuggingFace Router API client with OpenAI-compatible format."""

import asyncio
import json
import logging
from typing import AsyncGenerator
import httpx

from app.core.config import settings
from app.core.exceptions import RateLimitError

logger = logging.getLogger(__name__)


class GrokClient:
    """HuggingFace Router API client using OpenAI-compatible format (keeps 'Grok' name for compatibility)."""
    
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
        """Generate non-streaming completion using HuggingFace Router API (OpenAI-compatible)."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for attempt in range(self.max_retries):
                try:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers={
                            "Authorization": f"Bearer {self.api_key}",
                            "Content-Type": "application/json"
                        },
                        json={
                            "model": self.model,
                            "messages": [
                                {"role": "user", "content": prompt}
                            ],
                            "max_tokens": max_tokens,
                            "temperature": temperature,
                            "stream": False
                        }
                    )
                    
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
                    
                    # OpenAI-compatible format
                    return data["choices"][0]["message"]["content"]
                
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
                
                except KeyError as e:
                    logger.error(f"Invalid response format: {e}")
                    if attempt == self.max_retries - 1:
                        raise Exception("Invalid response format from API")
                    await asyncio.sleep(1)
        
        return "Unable to generate response"
    
    async def stream_completion(
        self,
        messages: list[dict],
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """Stream completion token by token using HuggingFace Router API (OpenAI-compatible SSE)."""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                async with client.stream(
                    "POST",
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "messages": messages,
                        "temperature": temperature,
                        "stream": True
                    }
                ) as response:
                    if response.status_code == 503:
                        logger.warning("Model is loading (cold start)")
                        yield "Model is loading, please wait..."
                        return
                    
                    if response.status_code == 429:
                        logger.warning("Rate limited")
                        yield "Rate limit exceeded, please try again later"
                        return
                    
                    response.raise_for_status()
                    
                    # Parse OpenAI-compatible SSE stream
                    async for line in response.aiter_lines():
                        if not line:
                            continue
                        
                        # SSE format: "data: {json}"
                        if line.startswith("data: "):
                            data_str = line[6:].strip()
                            
                            if data_str == "[DONE]":
                                break
                            
                            try:
                                chunk_json = json.loads(data_str)
                                delta = chunk_json.get("choices", [{}])[0].get("delta", {})
                                content = delta.get("content", "")
                                
                                if content:
                                    yield content
                            
                            except json.JSONDecodeError:
                                continue
            
            except Exception as e:
                logger.error(f"Streaming error: {e}")
                yield f"Error: {str(e)}"
