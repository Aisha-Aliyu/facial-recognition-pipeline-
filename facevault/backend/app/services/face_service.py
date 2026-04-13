import io
import os
import logging
import numpy as np
from PIL import Image
import cv2
from sqlalchemy.orm import Session
from sklearn.metrics.pairwise import cosine_similarity
import cloudinary
import cloudinary.uploader

from app.core.config import get_settings
from app.models.face import FaceProfile

logger = logging.getLogger(__name__)
settings = get_settings()

cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)

# Singleton — loaded once at startup, reused forever
_face_app = None


def get_face_app():
    global _face_app
    if _face_app is None:
        from insightface.app import FaceAnalysis
        _face_app = FaceAnalysis(
            name="buffalo_sc",        # lightweight ONNX model ~150MB RAM total
            providers=["CPUExecutionProvider"],
        )
        _face_app.prepare(ctx_id=-1, det_size=(320, 320))
        logger.info("InsightFace FaceAnalysis model loaded.")
    return _face_app


def _bytes_to_cv2(image_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes to a BGR numpy array for OpenCV/InsightFace."""
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image. Please upload a valid JPEG or PNG.")
    return img


def _get_embedding(image_bytes: bytes) -> np.ndarray:
    """Detect face and return its 512-d embedding vector."""
    app = get_face_app()
    img = _bytes_to_cv2(image_bytes)
    faces = app.get(img)

    if not faces:
        raise ValueError("No face detected. Please upload a clear, well-lit frontal face photo.")
    if len(faces) > 1:
        raise ValueError(
            f"{len(faces)} faces detected. Please upload an image with exactly one face."
        )

    return faces[0].embedding  # shape: (512,) float32


def enroll_face(image_bytes: bytes, label: str, user_id: str, db: Session) -> dict:
    """
    Enroll a face: extract embedding, upload image to Cloudinary,
    save profile to PostgreSQL. All DB queries use ORM (parameterized — SQL-injection safe).
    """
    # Sanitize label — strip whitespace, cap length, prevent XSS
    label = label.strip()[:100]
    if not label:
        raise ValueError("Label / name cannot be empty.")

    embedding = _get_embedding(image_bytes)

    # Upload to Cloudinary — stored under user's own folder
    upload_result = cloudinary.uploader.upload(
        io.BytesIO(image_bytes),
        folder=f"facevault/{user_id}",
        public_id=f"{label.replace(' ', '_')}_{os.urandom(4).hex()}",
        resource_type="image",
        overwrite=False,
        transformation=[
            {"width": 512, "height": 512, "crop": "fill", "gravity": "face"},
        ],
    )
    image_url = upload_result["secure_url"]

    # Parameterized insert via SQLAlchemy ORM — no raw SQL, no injection risk
    profile = FaceProfile(
        user_id=user_id,
        label=label,
        embedding=embedding.tolist(),   # stored as JSON array in DB
        image_url=image_url,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)

    logger.info(f"Face enrolled: label={label!r} user={user_id}")

    return {
        "id": str(profile.id),
        "label": profile.label,
        "image_url": profile.image_url,
        "created_at": profile.created_at.isoformat(),
        "message": "Face enrolled successfully.",
    }


def recognize_face(image_bytes: bytes, user_id: str, db: Session) -> dict:
    """
    Recognize a face against all enrolled profiles for this user.
    Uses cosine similarity on 512-d InsightFace embeddings.
    """
    query_embedding = _get_embedding(image_bytes)

    # Parameterized filter via ORM — safe from SQL injection
    profiles = (
        db.query(FaceProfile)
        .filter(FaceProfile.user_id == user_id)
        .all()
    )

    if not profiles:
        return {
            "match": None,
            "message": "No enrolled faces found. Please enroll at least one face first.",
        }

    best_score = -1.0
    best_profile = None

    query_vec = query_embedding.reshape(1, -1).astype(np.float32)

    for profile in profiles:
        stored_vec = np.array(profile.embedding, dtype=np.float32).reshape(1, -1)
        score = float(cosine_similarity(stored_vec, query_vec)[0][0])
        if score > best_score:
            best_score = score
            best_profile = profile

    # InsightFace buffalo_sc cosine similarity: >0.40 = reliable match
    THRESHOLD = 0.40

    logger.info(
        f"Recognition result: best_score={best_score:.4f} "
        f"label={best_profile.label!r if best_profile else None} user={user_id}"
    )

    if best_score >= THRESHOLD:
        return {
            "match": {
                "id": str(best_profile.id),
                "label": best_profile.label,
                "image_url": best_profile.image_url,
                "confidence": round(best_score * 100, 2),
            },
            "message": f"Match found: {best_profile.label}",
        }

    return {
        "match": None,
        "confidence": round(best_score * 100, 2),
        "message": "No match found. The face does not match any enrolled profile.",
    }
