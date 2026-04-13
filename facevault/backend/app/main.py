from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import asyncio
import logging
import os

from app.core.config import get_settings
from app.api.routes import faces, auth, health
from app.db.database import engine, Base

load_dotenv()

logger = logging.getLogger(__name__)
settings = get_settings()


def warmup_model():
    """Pre-load InsightFace ONNX model at startup so first request is instant."""
    try:
        logger.info("Warming up InsightFace model...")
        from app.services.face_service import get_face_app
        get_face_app()
        logger.info("InsightFace warm-up complete.")
    except Exception as e:
        logger.warning(f"Model warm-up failed (non-fatal): {e}")



@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────
    Base.metadata.create_all(bind=engine)
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, warmup_model)  
    yield
    # ── Shutdown ─────────────────────────────────────────────
    logger.info("FaceVault API shutting down.")


limiter = Limiter(key_func=get_remote_address, default_limits=["100/hour"])

app = FastAPI(
    title="FaceVault API",
    description="Production-grade facial recognition pipeline",
    version="1.0.0",
    lifespan=lifespan,                                          
    docs_url="/api/docs" if settings.environment == "development" else None,
    redoc_url=None,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [o.strip() for o in settings.allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(faces.router, prefix="/api/faces", tags=["faces"])


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, log_level="info")
