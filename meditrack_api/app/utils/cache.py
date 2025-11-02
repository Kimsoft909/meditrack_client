"""
Redis caching utilities for performance optimization.
Provides decorators and functions for caching expensive operations.
"""

import json
import logging
from functools import wraps
from typing import Callable, Any, Optional
import hashlib

import redis.asyncio as redis

from app.core.config import settings

logger = logging.getLogger(__name__)

# Redis client (lazy initialization)
_redis_client: Optional[redis.Redis] = None


async def get_redis_client() -> redis.Redis:
    """
    Get or create Redis client (singleton pattern).
    
    Returns:
        Redis client instance
    
    Example:
        >>> client = await get_redis_client()
        >>> await client.set("key", "value")
    """
    global _redis_client
    
    if _redis_client is None:
        _redis_client = await redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )
    
    return _redis_client


async def close_redis():
    """Close Redis connection gracefully."""
    global _redis_client
    
    if _redis_client:
        await _redis_client.close()
        _redis_client = None


def cache_result(ttl: int = 300, key_prefix: str = ""):
    """
    Decorator to cache function results in Redis.
    
    Caches the return value of an async function for the specified TTL.
    Cache key is generated from function name and arguments.
    
    Args:
        ttl: Time-to-live in seconds (default: 300 = 5 minutes)
        key_prefix: Prefix for cache keys (helps with organization)
    
    Returns:
        Decorator function
    
    Usage:
        @cache_result(ttl=600, key_prefix="dashboard")
        async def get_dashboard_stats():
            # Expensive query
            return stats
    
    Example:
        >>> @cache_result(ttl=300, key_prefix="patient")
        ... async def get_patient_data(patient_id: str):
        ...     return await db.query(...)
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            # Generate cache key from function signature
            cache_key = _generate_cache_key(func, args, kwargs, key_prefix)
            
            try:
                redis_client = await get_redis_client()
                
                # Try to get from cache
                cached_value = await redis_client.get(cache_key)
                
                if cached_value:
                    logger.debug(f"Cache hit: {cache_key}")
                    return json.loads(cached_value)
                
                logger.debug(f"Cache miss: {cache_key}")
                
                # Call function if not cached
                result = await func(*args, **kwargs)
                
                # Store in cache
                await redis_client.setex(
                    cache_key,
                    ttl,
                    json.dumps(result, default=str)
                )
                
                return result
            
            except Exception as e:
                logger.error(f"Cache error for {cache_key}: {e}")
                # If cache fails, still return result
                return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def _generate_cache_key(func: Callable, args: tuple, kwargs: dict, prefix: str) -> str:
    """
    Generate deterministic cache key from function and arguments.
    
    Args:
        func: Function being cached
        args: Positional arguments
        kwargs: Keyword arguments
        prefix: Key prefix
    
    Returns:
        Cache key string
    
    Example:
        >>> _generate_cache_key(get_patient, ("PAT-123",), {}, "patient")
        'patient:get_patient:a8b9c...'
    """
    # Create signature string
    func_name = func.__name__
    args_str = json.dumps(args, sort_keys=True, default=str)
    kwargs_str = json.dumps(kwargs, sort_keys=True, default=str)
    signature = f"{args_str}:{kwargs_str}"
    
    # Hash for consistent key length
    signature_hash = hashlib.md5(signature.encode()).hexdigest()[:12]
    
    if prefix:
        return f"{prefix}:{func_name}:{signature_hash}"
    else:
        return f"{func_name}:{signature_hash}"


async def invalidate_cache(pattern: str) -> int:
    """
    Delete all cache keys matching pattern.
    
    Useful for invalidating related caches after data changes.
    
    Args:
        pattern: Redis key pattern (supports wildcards)
    
    Returns:
        Number of keys deleted
    
    Example:
        >>> await invalidate_cache("patient:*")
        5
        >>> await invalidate_cache("dashboard:stats:*")
        12
    """
    try:
        redis_client = await get_redis_client()
        
        deleted_count = 0
        async for key in redis_client.scan_iter(match=pattern):
            await redis_client.delete(key)
            deleted_count += 1
        
        logger.info(f"Invalidated {deleted_count} cache keys matching '{pattern}'")
        return deleted_count
    
    except Exception as e:
        logger.error(f"Cache invalidation error: {e}")
        return 0


async def invalidate_patient_cache(patient_id: str) -> int:
    """
    Invalidate all cache keys related to a patient.
    
    Helper function for common invalidation pattern.
    
    Args:
        patient_id: Patient ID
    
    Returns:
        Number of keys deleted
    
    Example:
        >>> await invalidate_patient_cache("PAT-123")
        3
    """
    pattern = f"*patient*{patient_id}*"
    return await invalidate_cache(pattern)


async def get_cached_value(key: str) -> Optional[Any]:
    """
    Get value from cache by key.
    
    Args:
        key: Cache key
    
    Returns:
        Cached value (deserialized), or None if not found
    
    Example:
        >>> value = await get_cached_value("dashboard:stats:main")
        >>> print(value)
        {'total_patients': 150, ...}
    """
    try:
        redis_client = await get_redis_client()
        cached = await redis_client.get(key)
        
        if cached:
            return json.loads(cached)
        
        return None
    
    except Exception as e:
        logger.error(f"Cache retrieval error: {e}")
        return None


async def set_cached_value(key: str, value: Any, ttl: int = 300) -> bool:
    """
    Set value in cache with TTL.
    
    Args:
        key: Cache key
        value: Value to cache (must be JSON-serializable)
        ttl: Time-to-live in seconds
    
    Returns:
        True if successful, False otherwise
    
    Example:
        >>> await set_cached_value("temp:data", {"count": 42}, ttl=60)
        True
    """
    try:
        redis_client = await get_redis_client()
        await redis_client.setex(
            key,
            ttl,
            json.dumps(value, default=str)
        )
        return True
    
    except Exception as e:
        logger.error(f"Cache set error: {e}")
        return False


async def clear_all_cache() -> bool:
    """
    Clear ALL cached data (use with caution).
    
    Returns:
        True if successful
    
    Example:
        >>> await clear_all_cache()
        True
    """
    try:
        redis_client = await get_redis_client()
        await redis_client.flushdb()
        logger.warning("Cleared entire cache database")
        return True
    
    except Exception as e:
        logger.error(f"Cache clear error: {e}")
        return False


async def get_cache_stats() -> dict:
    """
    Get Redis cache statistics.
    
    Returns:
        Dictionary with cache metrics
    
    Example:
        >>> stats = await get_cache_stats()
        >>> print(stats['keys'])
        42
    """
    try:
        redis_client = await get_redis_client()
        info = await redis_client.info()
        
        return {
            "keys": await redis_client.dbsize(),
            "memory_used": info.get("used_memory_human"),
            "connected_clients": info.get("connected_clients"),
            "uptime_seconds": info.get("uptime_in_seconds"),
        }
    
    except Exception as e:
        logger.error(f"Cache stats error: {e}")
        return {}
