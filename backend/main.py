"""
Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger
import sys

from backend.config import settings
from backend.database import init_db
from backend.api import dicom_nodes, studies, prompts

# Configure logger
logger.remove()
logger.add(
    sys.stderr,
    level=settings.LOG_LEVEL,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>"
)
logger.add(
    "/app/data/logs/api_{time:YYYY-MM-DD}.log",
    rotation="1 day",
    retention="30 days",
    level=settings.LOG_LEVEL,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function} - {message}"
)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Automated DICOM Chest X-Ray Analysis System using MedGemma 27B",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Initialize application on startup
    """
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")

    # Initialize database
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Cleanup on shutdown
    """
    logger.info("Shutting down application")


# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# API info endpoint
@app.get(settings.API_PREFIX + "/")
async def api_info():
    """
    API information endpoint
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Automated DICOM Chest X-Ray Analysis System",
        "endpoints": {
            "docs": "/api/docs",
            "redoc": "/api/redoc",
            "openapi": "/api/openapi.json"
        }
    }


# Include routers
app.include_router(dicom_nodes.router, prefix=settings.API_PREFIX)
app.include_router(studies.router, prefix=settings.API_PREFIX)
app.include_router(prompts.router, prefix=settings.API_PREFIX)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """
    Global exception handler
    """
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "error": str(exc) if settings.DEBUG else "An error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
