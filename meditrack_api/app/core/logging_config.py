"""
Structured logging configuration (JSON logs for production).
"""

import logging
import sys
from typing import Any

from app.core.config import settings


class JSONFormatter(logging.Formatter):
    """Custom JSON log formatter."""

    def format(self, record: logging.LogRecord) -> str:
        import json
        from datetime import datetime

        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add custom fields
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        return json.dumps(log_data)


def setup_logging():
    """Configure application logging."""
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, settings.LOG_LEVEL))

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)

    if settings.LOG_FORMAT == "json":
        console_handler.setFormatter(JSONFormatter())
    else:
        console_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )

    root_logger.addHandler(console_handler)

    # Silence noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
