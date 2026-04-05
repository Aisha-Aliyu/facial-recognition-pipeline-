import uuid
from fastapi import (
    APIRouter, Depends, HTTPException,
    Request, UploadFile, File, Form,
    status, Query
)
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from typing import List

from app.db.database import get_db
from app.models.models import User, FaceProfile, RecognitionLog
from app.schemas.schemas import (
    FaceProfileOut, RecognitionResult,
    PaginatedFaceProfiles, RecognitionLogOut
)
from app.services.face_service import extract_embedding, find_best_match
from app.services.storage_service import upload_face_image, delete_face_image

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def get_user_by_clerk(clerk_id: str, db: Session) -> User:
    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please sync first.")
    return user


@router.post("/enroll", response_model=FaceProfileOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("100/hour")
async def enroll_face(
    request: Request,
    label: str = Form(..., min_length=1, max_length=100),
    clerk_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Enroll a new face profile for a user."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, and WebP images are allowed.")

    image_bytes = await file.read()

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image must be under 5MB.")

    user = get_user_by_clerk(clerk_id, db)

    try:
        embedding = extract_embedding(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"No face detected or extraction failed: {str(e)}")

    public_id = f"facevault_{user.id}_{uuid.uuid4().hex[:8]}"

    try:
        uploaded = upload_face_image(image_bytes, public_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    profile = FaceProfile(
        user_id=user.id,
        label=label.strip(),
        image_url=uploaded["url"],
        cloudinary_public_id=uploaded["public_id"],
        embedding=embedding,
        model_used="Facenet512",
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/recognize", response_model=RecognitionResult)
@limiter.limit("100/hour")
async def recognize_face(
    request: Request,
    clerk_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Recognize a face against enrolled profiles."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=415, detail="Only JPEG, PNG, and WebP images are allowed.")

    image_bytes = await file.read()

    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Image must be under 5MB.")

    user = get_user_by_clerk(clerk_id, db)

    try:
        query_embedding = extract_embedding(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"No face detected: {str(e)}")

    profiles_raw = (
        db.query(FaceProfile)
        .filter(FaceProfile.user_id == user.id, FaceProfile.is_active == True)
        .all()
    )

    profiles = [
        {"id": str(p.id), "label": p.label, "embedding": p.embedding}
        for p in profiles_raw
    ]

    match = find_best_match(query_embedding, profiles)

    log = RecognitionLog(
        user_id=user.id,
        face_profile_id=match["face_profile_id"] if match else None,
        matched=match is not None,
        confidence=match["confidence"] if match else None,
        distance=match["distance"] if match else None,
        model_used="Facenet512",
        ip_address=request.client.host if request.client else None,
    )
    db.add(log)
    db.commit()

    if match:
        return RecognitionResult(
            matched=True,
            confidence=match["confidence"],
            distance=match["distance"],
            label=match["label"],
            face_profile_id=match["face_profile_id"],
            message=f"Match found: {match['label']} ({match['confidence']}% confidence)",
        )

    return RecognitionResult(
        matched=False,
        confidence=None,
        distance=None,
        label=None,
        face_profile_id=None,
        message="No match found in enrolled profiles.",
    )


@router.get("/profiles", response_model=PaginatedFaceProfiles)
@limiter.limit("100/hour")
async def list_profiles(
    request: Request,
    clerk_id: str = Query(...),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    user = get_user_by_clerk(clerk_id, db)
    offset = (page - 1) * per_page
    total = db.query(FaceProfile).filter(FaceProfile.user_id == user.id).count()
    items = (
        db.query(FaceProfile)
        .filter(FaceProfile.user_id == user.id, FaceProfile.is_active == True)
        .order_by(FaceProfile.created_at.desc())
        .offset(offset)
        .limit(per_page)
        .all()
    )
    return PaginatedFaceProfiles(items=items, total=total, page=page, per_page=per_page)


@router.delete("/profiles/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("100/hour")
async def delete_profile(
    request: Request,
    profile_id: str,
    clerk_id: str = Query(...),
    db: Session = Depends(get_db),
):
    user = get_user_by_clerk(clerk_id, db)
    profile = (
        db.query(FaceProfile)
        .filter(FaceProfile.id == profile_id, FaceProfile.user_id == user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    delete_face_image(profile.cloudinary_public_id)
    db.delete(profile)
    db.commit()


@router.get("/logs", response_model=List[RecognitionLogOut])
@limiter.limit("100/hour")
async def get_logs(
    request: Request,
    clerk_id: str = Query(...),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    user = get_user_by_clerk(clerk_id, db)
    logs = (
        db.query(RecognitionLog)
        .filter(RecognitionLog.user_id == user.id)
        .order_by(RecognitionLog.created_at.desc())
        .limit(limit)
        .all()
    )
    result = []
    for log in logs:
        label = log.face_profile.label if log.face_profile else None
        result.append(RecognitionLogOut(
            id=log.id,
            matched=log.matched,
            confidence=log.confidence,
            label=label,
            created_at=log.created_at,
        ))
    return result
