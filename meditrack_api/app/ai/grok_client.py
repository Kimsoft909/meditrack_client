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
    
    def _parse_non_streaming_response(self, data: dict) -> str:
        """
        Parse API response with robust error handling.
        Supports multiple response formats from different API providers.
        """
        logger.info(f"Parsing API response with keys: {list(data.keys())}")
        
        # Try OpenAI-compatible format (standard)
        try:
            content = data["choices"][0]["message"]["content"]
            logger.info(f"✓ Successfully parsed OpenAI format, content length: {len(content)}")
            return content
        except (KeyError, IndexError, TypeError) as e:
            logger.warning(f"OpenAI format parsing failed: {type(e).__name__}: {e}")
        
        # Try alternative formats
        alternative_formats = [
            ("generated_text", "HuggingFace"),
            ("text", "Direct text"),
            ("response", "Generic response"),
            ("content", "Direct content")
        ]
        
        for field, format_name in alternative_formats:
            if field in data:
                logger.info(f"✓ Using {format_name} format: field '{field}'")
                return str(data[field])
        
        # Log full structure for debugging
        logger.error(f"❌ Unable to parse response. Full structure:\n{json.dumps(data, indent=2)}")
        raise Exception(f"Unexpected API response format. Available keys: {list(data.keys())}")
    
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
                    
                    # Log successful API call
                    logger.info(f"API returned status {response.status_code}")
                    logger.debug(f"Full API response: {json.dumps(data, indent=2)}")
                    
                    # Parse response using robust method
                    return self._parse_non_streaming_response(data)
                
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
                                
                                # Safely extract content with multiple fallbacks
                                choices = chunk_json.get("choices", [])
                                
                                if not choices:
                                    # Some SSE events don't have choices (metadata events)
                                    logger.debug(f"Skipping chunk without choices: {list(chunk_json.keys())}")
                                    continue
                                
                                delta = choices[0].get("delta", {})
                                content = delta.get("content", "")
                                
                                if content:
                                    yield content
                            
                            except json.JSONDecodeError as e:
                                logger.debug(f"JSON decode error (partial chunk): {e}")
                                continue
                            except (KeyError, IndexError, TypeError) as e:
                                logger.warning(f"Unexpected chunk structure: {type(e).__name__}: {e}")
                                logger.debug(f"Problematic chunk: {data_str[:200]}")
                                continue
            
            except Exception as e:
                logger.error(f"Streaming error: {e}")
                yield f"Error: {str(e)}"
