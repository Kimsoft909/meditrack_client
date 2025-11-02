"""
Standardized pagination utilities for API list endpoints.
Supports both offset-based and cursor-based pagination.
"""

import base64
import json
from typing import TypeVar, Generic, List, Optional
from datetime import datetime

from pydantic import BaseModel, Field
from sqlalchemy import Select
from sqlalchemy.ext.asyncio import AsyncSession

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Standard offset-based pagination parameters."""
    
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=50, ge=1, le=200, description="Items per page")
    
    @property
    def offset(self) -> int:
        """Calculate offset from page and page_size."""
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        """Alias for page_size."""
        return self.page_size


class CursorPaginationParams(BaseModel):
    """Cursor-based pagination (better for real-time data)."""
    
    cursor: Optional[str] = Field(default=None, description="Opaque cursor for next page")
    limit: int = Field(default=50, ge=1, le=200, description="Items per page")
    
    def decode_cursor(self) -> Optional[dict]:
        """Decode cursor to dict."""
        if not self.cursor:
            return None
        
        try:
            decoded = base64.b64decode(self.cursor).decode("utf-8")
            return json.loads(decoded)
        except (ValueError, json.JSONDecodeError):
            return None


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response with metadata."""
    
    items: List[T] = Field(description="Page items")
    total: int = Field(description="Total items across all pages")
    page: int = Field(description="Current page number")
    page_size: int = Field(description="Items per page")
    total_pages: int = Field(description="Total number of pages")
    has_next: bool = Field(description="Whether next page exists")
    has_prev: bool = Field(description="Whether previous page exists")
    
    @classmethod
    def create(
        cls,
        items: List[T],
        total: int,
        page: int,
        page_size: int
    ) -> "PaginatedResponse[T]":
        """
        Factory method to create paginated response.
        
        Args:
            items: Items in current page
            total: Total items across all pages
            page: Current page number
            page_size: Items per page
        
        Returns:
            PaginatedResponse instance
        
        Example:
            >>> items = [Patient(...), Patient(...)]
            >>> response = PaginatedResponse.create(items, 100, 1, 50)
            >>> response.has_next
            True
        """
        total_pages = (total + page_size - 1) // page_size  # Ceiling division
        
        return cls(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_prev=page > 1
        )


class CursorPaginatedResponse(BaseModel, Generic[T]):
    """Cursor-based paginated response."""
    
    items: List[T] = Field(description="Page items")
    next_cursor: Optional[str] = Field(description="Cursor for next page")
    has_more: bool = Field(description="Whether more items exist")
    
    @classmethod
    def create(
        cls,
        items: List[T],
        limit: int,
        cursor_field: str = "id"
    ) -> "CursorPaginatedResponse[T]":
        """
        Factory method for cursor pagination.
        
        Args:
            items: Items in current page (should fetch limit+1)
            limit: Requested page size
            cursor_field: Field to use for cursor (default: id)
        
        Returns:
            CursorPaginatedResponse instance
        
        Example:
            >>> items = fetch_items(limit=51)  # Fetch 51 to check if more exist
            >>> response = CursorPaginatedResponse.create(items, 50)
        """
        has_more = len(items) > limit
        
        if has_more:
            items = items[:limit]
            last_item = items[-1]
            next_cursor = encode_cursor({cursor_field: str(getattr(last_item, cursor_field))})
        else:
            next_cursor = None
        
        return cls(
            items=items,
            next_cursor=next_cursor,
            has_more=has_more
        )


def apply_pagination(query: Select, params: PaginationParams) -> Select:
    """
    Apply offset pagination to SQLAlchemy query.
    
    Args:
        query: SQLAlchemy select query
        params: Pagination parameters
    
    Returns:
        Query with offset and limit applied
    
    Example:
        >>> from sqlalchemy import select
        >>> query = select(Patient)
        >>> params = PaginationParams(page=2, page_size=50)
        >>> paginated_query = apply_pagination(query, params)
    """
    return query.offset(params.offset).limit(params.limit)


def apply_cursor_pagination(
    query: Select,
    params: CursorPaginationParams,
    cursor_field: str = "id"
) -> Select:
    """
    Apply cursor pagination to SQLAlchemy query.
    
    Args:
        query: SQLAlchemy select query
        params: Cursor pagination parameters
        cursor_field: Field to use for cursor comparison
    
    Returns:
        Query with cursor filter and limit applied
    
    Example:
        >>> query = select(Patient).order_by(Patient.id)
        >>> params = CursorPaginationParams(cursor="abc123", limit=50)
        >>> paginated_query = apply_cursor_pagination(query, params)
    """
    cursor_data = params.decode_cursor()
    
    if cursor_data and cursor_field in cursor_data:
        # Add WHERE clause for cursor
        # Note: This assumes ordering by cursor_field
        cursor_value = cursor_data[cursor_field]
        query = query.where(getattr(query.column_descriptions[0]["entity"], cursor_field) > cursor_value)
    
    # Fetch limit + 1 to check if more exist
    return query.limit(params.limit + 1)


def encode_cursor(data: dict) -> str:
    """
    Encode cursor data to opaque string.
    
    Args:
        data: Dictionary to encode (e.g., {"id": "123", "timestamp": "2024-01-01"})
    
    Returns:
        Base64-encoded cursor string
    
    Example:
        >>> encode_cursor({"id": "PAT-123", "timestamp": "2024-01-01"})
        'eyJpZCI6ICJQQVQ...'
    """
    json_str = json.dumps(data, default=str)
    encoded = base64.b64encode(json_str.encode("utf-8"))
    return encoded.decode("utf-8")


def decode_cursor(cursor: str) -> Optional[dict]:
    """
    Decode cursor string to dictionary.
    
    Args:
        cursor: Base64-encoded cursor string
    
    Returns:
        Decoded dictionary, or None if invalid
    
    Example:
        >>> cursor = encode_cursor({"id": "PAT-123"})
        >>> decode_cursor(cursor)
        {'id': 'PAT-123'}
    """
    if not cursor:
        return None
    
    try:
        decoded = base64.b64decode(cursor).decode("utf-8")
        return json.loads(decoded)
    except (ValueError, json.JSONDecodeError):
        return None


async def paginate_query(
    db: AsyncSession,
    query: Select,
    params: PaginationParams,
    count_query: Optional[Select] = None
) -> PaginatedResponse:
    """
    Execute paginated query and return PaginatedResponse.
    
    Args:
        db: Database session
        query: Main query (will be paginated)
        params: Pagination parameters
        count_query: Optional separate count query (for performance)
    
    Returns:
        PaginatedResponse with items and metadata
    
    Example:
        >>> query = select(Patient).where(Patient.status == "active")
        >>> params = PaginationParams(page=1, page_size=50)
        >>> result = await paginate_query(db, query, params)
    """
    from sqlalchemy import func, select as sa_select
    
    # Get total count
    if count_query is None:
        # Build count query from main query
        count_query = sa_select(func.count()).select_from(query.subquery())
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Get paginated items
    paginated_query = apply_pagination(query, params)
    items_result = await db.execute(paginated_query)
    items = items_result.scalars().all()
    
    return PaginatedResponse.create(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size
    )
