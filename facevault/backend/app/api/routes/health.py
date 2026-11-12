from fastapi import APIRouter, Request
from slowapi import Limiter
from app.core.client_ip import client_ip
import time

router = APIRouter()
limiter = Limiter(key_func=client_ip)

START_TIME = time.time()


@router.get("/health")
@limiter.limit("100/hour")
async def health_check(request: Request):
    uptime = round(time.time() - START_TIME, 2)
    return {
        "status": "ok",
        "service": "FaceVault API",
        "version": "1.0.0",
        "uptime_seconds": uptime,
    }
