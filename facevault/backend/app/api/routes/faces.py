from fastapi import APIRouter, Request, HTTPException, Depends, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.db.database import get_db
from app.models.user import User
from app.models.face import FaceRecord
from app.schemas.face import FaceOut, MatchResult
from app.core.security import verify_clerk_token
from app.services.face_service import enroll_face, recognize_face, delete_face_data
from app.services.storage_service import upload_image, delete_image

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


async def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    payload = await verify_clerk_token(request)
    clerk_id = payload.get("sub")
    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Call /auth/sync first.")
    return user


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

    # Upload raw image to Cloudinary 
    image_url, public_id = await upload_image(
        contents, folder=f"facevault/{current_user.clerk_id}"
    )

    embedding = await run_in_threadpool(enroll_face, contents)

    if embedding is None:
        await delete_image(public_id)
        raise HTTPException(
            status_code=422,
            detail="No face detected in the image. Please use a clear front-facing photo.",
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

    results = await run_in_threadpool(recognize_face, contents, enrolled)

    if not results:
        raise HTTPException(
            status_code=422,
            detail="No face detected in the uploaded image.",
        )

    return results


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
