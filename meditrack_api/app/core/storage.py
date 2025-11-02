"""
File storage utilities for avatar uploads.
"""

import uuid
from pathlib import Path
from typing import Optional

from fastapi import UploadFile


# Storage configuration
UPLOAD_DIR = Path("uploads/avatars")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_SIZE_MB = 5
MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024


async def save_avatar(file: UploadFile, user_id: str) -> str:
    """
    Save avatar file and return URL.

    Args:
        file: Uploaded file
        user_id: User ID for unique filename

    Returns:
        URL path to saved avatar

    Raises:
        ValueError: If file type or size is invalid
    """
    # Validate file extension
    if not file.filename:
        raise ValueError("Filename is required")

    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Invalid file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read and validate file size
    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise ValueError(f"File too large. Maximum size: {MAX_SIZE_MB}MB")

    # Validate it's actually an image (check magic bytes)
    if not _is_valid_image(contents, ext):
        raise ValueError("File does not appear to be a valid image")

    # Generate unique filename
    filename = f"{user_id}_{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename

    # Save file
    with open(filepath, "wb") as f:
        f.write(contents)

    # Return URL path
    return f"/uploads/avatars/{filename}"


async def delete_avatar(avatar_url: Optional[str]) -> None:
    """
    Delete avatar file from storage.

    Args:
        avatar_url: URL path to avatar (e.g., "/uploads/avatars/user123_abc.jpg")
    """
    if not avatar_url:
        return

    try:
        filename = avatar_url.split("/")[-1]
        filepath = UPLOAD_DIR / filename

        if filepath.exists() and filepath.parent == UPLOAD_DIR:
            filepath.unlink()
    except Exception:
        # Silently fail - avatar cleanup is not critical
        pass


def _is_valid_image(contents: bytes, ext: str) -> bool:
    """
    Validate image file by checking magic bytes.

    Args:
        contents: File contents
        ext: File extension

    Returns:
        True if file appears to be a valid image
    """
    if len(contents) < 12:
        return False

    # Check magic bytes for common image formats
    magic_bytes = {
        ".jpg": [b"\xff\xd8\xff"],
        ".jpeg": [b"\xff\xd8\xff"],
        ".png": [b"\x89\x50\x4e\x47"],
        ".webp": [b"RIFF", b"WEBP"],
    }

    signatures = magic_bytes.get(ext, [])
    return any(contents.startswith(sig) for sig in signatures)
