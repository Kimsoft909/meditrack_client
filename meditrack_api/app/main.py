"""
FastAPI application initialization with CORS, middleware, and routing.
"""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import init_db, close_db
from app.core.middleware import RequestIDMiddleware, TimingMiddleware
from app.core.logging_config import setup_logging
from app.api.v1.router import api_router
from app.utils.cache import get_redis_client, close_redis

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    setup_logging()
    await init_db()
    try:
        await get_redis_client()
        logger.info("Redis cache initialized successfully")
    except Exception as e:
        logger.warning(f"Redis initialization failed: {e}. Continuing without cache.")
    
    yield
    
    # Shutdown
    await close_db()
    await close_redis()
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Clinical Patient Management System API",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom Middleware
app.add_middleware(RequestIDMiddleware)
app.add_middleware(TimingMiddleware)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for load balancers."""
    return JSONResponse(
        content={
            "status": "healthy",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
        }
    )


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint."""
    return {
        "message": "MEDITRACK API",
        "version": settings.VERSION,
        "docs": "/docs",
    }
