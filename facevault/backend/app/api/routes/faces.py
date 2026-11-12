from fastapi import APIRouter, Request, HTTPException, Depends, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from slowapi import Limiter
from app.core.client_ip import client_ip
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError, ProgrammingError
from typing import List
import logging
import uuid

from app.db.database import get_db
from app.models.user import User
from app.models.face import FaceRecord, RecognitionEvent
from app.schemas.face import FaceOut, MatchResult, LogOut
from app.core.security import verify_clerk_token
from app.services.face_service import enroll_face, recognize_face, delete_face_data, FaceImageError
from app.services.storage_service import upload_image, delete_image
from app.services.user_service import get_or_create_user

router = APIRouter()
limiter = Limiter(key_func=client_ip)
logger = logging.getLogger(__name__)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    # Creates the user on first use, so nothing depends on the dashboard's sync call
    # having worked, which can fail while the server is waking up
    payload = await verify_clerk_token(request)
    return get_or_create_user(db, payload)


def validate_image(file: UploadFile):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Allowed: JPEG, PNG, WEBP"
        )


# ──────────────────────────────────────────────
# ENROLL a face
# ──────────────────────────────────────────────
@router.post("/enroll", response_model=FaceOut)
@limiter.limit("100/hour")
async def enroll(
    request: Request,
    label: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    validate_image(file)

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 5MB.")

    label = label.strip()
    if not label or len(label) > 100:
        raise HTTPException(status_code=400, detail="Label must be 1-100 characters.")

    # Check the face first, so photos without one are never uploaded
    try:
        embedding = await run_in_threadpool(enroll_face, contents)
    except FaceImageError as e:
        raise HTTPException(status_code=422, detail=str(e))

    image_url, public_id = await upload_image(
        contents, folder=f"facevault/{current_user.clerk_id}"
    )

    record = FaceRecord(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        label=label,
        embedding=embedding,
        image_url=image_url,
        cloudinary_public_id=public_id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


# ──────────────────────────────────────────────
# RECOGNIZE a face
# ──────────────────────────────────────────────
@router.post("/recognize", response_model=List[MatchResult])
@limiter.limit("100/hour")
async def recognize(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    validate_image(file)

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 5MB.")

    enrolled = db.query(FaceRecord).filter(FaceRecord.user_id == current_user.id).all()
    if not enrolled:
        raise HTTPException(
            status_code=404,
            detail="No enrolled faces found. Enroll faces first.",
        )

    try:
        results = await run_in_threadpool(recognize_face, contents, enrolled)
    except FaceImageError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # A face was found, so record the attempt whether or not anything matched.
    # The audit entry is secondary: if saving it fails, the result is still returned.
    best = results[0] if results else None
    try:
        db.add(RecognitionEvent(
            user_id=str(current_user.id),
            matched=best is not None,
            label=best["label"] if best else None,
            confidence=best["confidence"] if best else None,
        ))
        db.commit()
    except SQLAlchemyError as e:
        db.rollback()
        logger.warning(f"Could not save the recognition event: {e}")

    return results


# ──────────────────────────────────────────────
# AUDIT LOG of recognition attempts
# ──────────────────────────────────────────────
@router.get("/logs", response_model=List[LogOut])
@limiter.limit("100/hour")
async def list_logs(
    request: Request,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    limit = max(1, min(limit, 100))
    try:
        return (
            db.query(RecognitionEvent)
            .filter(RecognitionEvent.user_id == str(current_user.id))
            .order_by(RecognitionEvent.created_at.desc())
            .limit(limit)
            .all()
        )
    except ProgrammingError as e:
        db.rollback()
        # Only a missing table means "nothing logged yet". Anything else is a real error.
        if getattr(e.orig, "pgcode", None) == "42P01":
            logger.warning("recognition_events table is missing, so the log is empty")
            return []
        raise


# ──────────────────────────────────────────────
# LIST enrolled faces
# ──────────────────────────────────────────────
@router.get("/", response_model=List[FaceOut])
@limiter.limit("100/hour")
async def list_faces(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = db.query(FaceRecord).filter(FaceRecord.user_id == current_user.id).all()
    return records


# ──────────────────────────────────────────────
# DELETE an enrolled face
# ──────────────────────────────────────────────
@router.delete("/{face_id}")
@limiter.limit("100/hour")
async def delete_face(
    request: Request,
    face_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(FaceRecord).filter(
        FaceRecord.id == face_id,
        FaceRecord.user_id == current_user.id,
    ).first()

    if not record:
        raise HTTPException(status_code=404, detail="Face record not found.")

    if record.cloudinary_public_id:
        await delete_image(record.cloudinary_public_id)

    db.delete(record)
    db.commit()

    return {"message": "Face record deleted successfully.", "id": face_id}
