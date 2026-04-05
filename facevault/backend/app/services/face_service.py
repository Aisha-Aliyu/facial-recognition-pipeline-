import numpy as np
import cv2
from deepface import DeepFace
from typing import Optional
import tempfile
import os


MODEL_NAME = "Facenet512"
DETECTOR_BACKEND = "retinaface"
DISTANCE_THRESHOLD = 0.40


def extract_embedding(image_bytes: bytes) -> list[float]:
    """Extract 512-d face embedding from image bytes."""
    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name

    try:
        result = DeepFace.represent(
            img_path=tmp_path,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR_BACKEND,
            enforce_detection=True,
            align=True,
        )
        embedding = result[0]["embedding"]
        return embedding
    finally:
        os.unlink(tmp_path)


def cosine_distance(a: list[float], b: list[float]) -> float:
    """Compute cosine distance between two embedding vectors."""
    vec_a = np.array(a, dtype=np.float32)
    vec_b = np.array(b, dtype=np.float32)
    dot = np.dot(vec_a, vec_b)
    norm = np.linalg.norm(vec_a) * np.linalg.norm(vec_b)
    if norm == 0:
        return 1.0
    return float(1.0 - (dot / norm))


def find_best_match(
    query_embedding: list[float],
    profiles: list[dict],
) -> Optional[dict]:
    """
    Compare query embedding against all stored profiles.
    Returns best match if within threshold, else None.
    """
    best = None
    best_distance = float("inf")

    for profile in profiles:
        dist = cosine_distance(query_embedding, profile["embedding"])
        if dist < best_distance:
            best_distance = dist
            best = profile

    if best is None or best_distance > DISTANCE_THRESHOLD:
        return None

    confidence = round((1.0 - best_distance) * 100, 2)
    return {
        "face_profile_id": best["id"],
        "label": best["label"],
        "distance": round(best_distance, 6),
        "confidence": confidence,
    }
