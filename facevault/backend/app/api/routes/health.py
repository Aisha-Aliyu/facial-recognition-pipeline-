from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.get("/health")
@limiter.limit("100/hour")
async def health_check(request: Request):
    return {"status": "ok", "service": "FaceVault API", "version": "1.0.0"}
