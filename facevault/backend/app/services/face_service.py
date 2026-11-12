import io
import logging
import numpy as np
import cv2
from PIL import Image
from sqlalchemy.orm import Session

from app.models.face import FaceRecord

logger = logging.getLogger(__name__)

# Cosine similarity a match has to reach to count as the same person
MATCH_THRESHOLD = 0.40
# A small file can unpack into a huge image, so check the size before decoding it
MAX_PIXELS = 25_000_000
# Detection runs at 320px, so larger photos are scaled down to save memory
MAX_SIDE = 1600

_face_app = None


class FaceImageError(ValueError):
    """The image can't be used: unreadable, no face, or more faces than allowed."""


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
    try:
        with Image.open(io.BytesIO(image_bytes)) as probe:
            width, height = probe.size
    except Exception:
        raise FaceImageError("Could not read the image. Please upload a JPEG, PNG or WebP photo.")
    if width * height > MAX_PIXELS:
        raise FaceImageError("The image is too large. Please use a photo under 25 megapixels.")

    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise FaceImageError("Could not read the image. Please upload a JPEG, PNG or WebP photo.")

    longest = max(img.shape[:2])
    if longest > MAX_SIDE:
        scale = MAX_SIDE / longest
        img = cv2.resize(img, None, fx=scale, fy=scale, interpolation=cv2.INTER_AREA)
    return img


def _face_area(face) -> float:
    x1, y1, x2, y2 = face.bbox
    return float((x2 - x1) * (y2 - y1))


def _normalise(vec: np.ndarray) -> np.ndarray:
    norm = float(np.linalg.norm(vec))
    return vec / norm if norm > 0 else vec


def extract_embedding(image_bytes: bytes, require_single: bool) -> np.ndarray:
    """Returns the unit-length embedding of the face in the image.

    With require_single, an image with more than one face is refused. Otherwise the
    largest face is used, which is usually the person the photo is about.
    """
    img = _bytes_to_cv2(image_bytes)
    faces = get_face_app().get(img)

    if not faces:
        raise FaceImageError("No face found in the image. Use a clear, front-facing photo.")
    if require_single and len(faces) > 1:
        raise FaceImageError(
            f"{len(faces)} faces found. Please upload a photo with exactly one face."
        )

    face = max(faces, key=_face_area)
    return _normalise(np.asarray(face.embedding, dtype=np.float32))


def enroll_face(image_bytes: bytes) -> list:
    """Embedding for a new profile. The photo must show exactly one face."""
    return extract_embedding(image_bytes, require_single=True).tolist()


def recognize_face(image_bytes: bytes, enrolled: list) -> list:
    """Ranks enrolled faces by similarity to the main face in the image.

    Returns an empty list when a face is found but nothing in the vault matches.
    Raises FaceImageError when the image has no usable face.
    """
    query = extract_embedding(image_bytes, require_single=False)

    results = []
    for record in enrolled:
        stored = _normalise(np.asarray(record.embedding, dtype=np.float32))
        score = float(np.dot(query, stored))
        if score >= MATCH_THRESHOLD:
            results.append({
                "id": str(record.id),
                "label": record.label,
                "image_url": record.image_url,
                "confidence": round(score * 100, 2),
            })

    results.sort(key=lambda r: r["confidence"], reverse=True)
    logger.info(f"Recognition: matches={len(results)}")
    return results


def delete_face_data(record: FaceRecord, db: Session) -> None:
    """Delete FaceRecord from DB. Cloudinary deletion handled in route layer."""
    db.delete(record)
    db.commit()
    logger.info(f"Face record deleted: id={record.id!r} label={record.label!r}")
