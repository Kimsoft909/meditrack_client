"""Async Grok AI client with retry logic and rate limiting."""

import asyncio
import json
from typing import AsyncGenerator
import httpx

from app.core.config import settings
from app.core.exceptions import RateLimitError


class GrokClient:
    def __init__(self):
        self.base_url = settings.GROK_API_BASE_URL
        self.api_key = settings.GROK_API_KEY
        self.model = settings.GROK_MODEL
        self.max_retries = 3
    
    async def generate_completion(
        self,
        prompt: str,
        max_tokens: int = 1024,
        temperature: float = 0.7
    ) -> str:
        """Generate non-streaming completion."""
        async with httpx.AsyncClient(timeout=settings.GROK_TIMEOUT_SECONDS) as client:
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
                            "messages": [{"role": "user", "content": prompt}],
                            "max_tokens": max_tokens,
                            "temperature": temperature
                        }
                    )
                    
                    if response.status_code == 429:
                        if attempt < self.max_retries - 1:
                            await asyncio.sleep(2 ** attempt)
                            continue
                        raise RateLimitError()
                    
                    response.raise_for_status()
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
                
                except httpx.RequestError:
                    if attempt == self.max_retries - 1:
                        raise
                    await asyncio.sleep(1)
        
        return "Unable to generate response"
    
    async def stream_completion(
        self,
        messages: list[dict],
        temperature: float = 0.7
    ) -> AsyncGenerator[str, None]:
        """Stream completion token by token."""
        async with httpx.AsyncClient(timeout=settings.GROK_TIMEOUT_SECONDS) as client:
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
                response.raise_for_status()
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        chunk_data = line[6:]
                        if chunk_data == "[DONE]":
                            break
                        
                        try:
                            chunk_json = json.loads(chunk_data)
                            delta = chunk_json["choices"][0]["delta"]
                            if "content" in delta:
                                yield delta["content"]
                        except json.JSONDecodeError:
                            continue
