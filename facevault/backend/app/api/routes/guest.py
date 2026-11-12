from fastapi import APIRouter, Request, HTTPException, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from slowapi import Limiter
from app.core.client_ip import client_ip

from app.schemas.face import EmbeddingOut
from app.services.face_service import extract_embedding, FaceImageError

# Guest mode lets visitors try FaceVault without an account. The server only turns a
# photo into an embedding and keeps nothing: no photo, no embedding, no log. The
# visitor's vault lives in their own browser.

router = APIRouter()
limiter = Limiter(key_func=client_ip)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/embed", response_model=EmbeddingOut)
@limiter.limit("60/hour")
async def embed(
    request: Request,
    file: UploadFile = File(...),
    purpose: str = Form("enroll"),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: JPEG, PNG, WEBP",
        )

    contents = await file.read(MAX_FILE_SIZE + 1)
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 5MB.")

    try:
        vector = await run_in_threadpool(
            extract_embedding, contents, purpose == "enroll"
        )
    except FaceImageError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return {"embedding": [round(float(x), 6) for x in vector]}
