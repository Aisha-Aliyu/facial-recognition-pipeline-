import logging
import numpy as np
import cv2
from sqlalchemy.orm import Session
from sklearn.metrics.pairwise import cosine_similarity

from app.models.face import FaceRecord

logger = logging.getLogger(__name__)

_face_app = None


def get_face_app():
    global _face_app
    if _face_app is None:
        from insightface.app import FaceAnalysis
        _face_app = FaceAnalysis(
            name="buffalo_sc",
            providers=["CPUExecutionProvider"],
        )
        _face_app.prepare(ctx_id=-1, det_size=(320, 320))
        logger.info("InsightFace FaceAnalysis model loaded.")
    return _face_app


def _bytes_to_cv2(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image. Please upload a valid JPEG or PNG.")
    return img


def enroll_face(image_bytes: bytes) -> list | None:
    """Extract embedding only. Returns list or None. Routes handle DB and Cloudinary."""
    app = get_face_app()
    img = _bytes_to_cv2(image_bytes)
    faces = app.get(img)

    if not faces:
        return None

    if len(faces) > 1:
        raise ValueError(
            f"{len(faces)} faces detected. Please upload an image with exactly one face."
        )

    return faces[0].embedding.tolist()


def recognize_face(image_bytes: bytes, enrolled: list) -> list:
    """Compare image against list of FaceRecord ORM objects. Returns ranked matches."""
    app = get_face_app()
    img = _bytes_to_cv2(image_bytes)
    faces = app.get(img)

    if not faces:
        return []

    query_vec = faces[0].embedding.reshape(1, -1).astype(np.float32)

    THRESHOLD = 0.40
    results = []

    for record in enrolled:
        stored_vec = np.array(record.embedding, dtype=np.float32).reshape(1, -1)
        score = float(cosine_similarity(stored_vec, query_vec)[0][0])
        if score >= THRESHOLD:
            results.append({
                "id": str(record.id),
                "label": record.label,
                "image_url": record.image_url,
                "confidence": round(score * 100, 2),
            })

    results.sort(key=lambda x: x["confidence"], reverse=True)
    best_label = results[0]["label"] if results else None
    logger.info(f"Recognition: best_label={best_label!r} matches={len(results)}")
    return results


def delete_face_data(record: FaceRecord, db: Session) -> None:
    """Delete FaceRecord from DB. Cloudinary deletion handled in route layer."""
    db.delete(record)
    db.commit()
    logger.info(f"Face record deleted: id={record.id!r} label={record.label!r}")
