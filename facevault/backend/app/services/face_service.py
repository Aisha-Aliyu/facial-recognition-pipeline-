from deepface import DeepFace
import numpy as np
import cv2
from typing import Optional, List
from app.schemas.face import MatchResult

MODEL_NAME = "Facenet512"
DETECTOR = "opencv"
CONFIDENCE_THRESHOLD = 60.0


def _bytes_to_cv2(contents: bytes) -> np.ndarray:
    arr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image.")
    return img


def enroll_face(contents: bytes) -> Optional[List[float]]:
    try:
        img = _bytes_to_cv2(contents)
        embedding_objs = DeepFace.represent(
            img_path=img,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR,
            enforce_detection=True,
        )
        if not embedding_objs:
            return None
        return embedding_objs[0]["embedding"]
    except Exception:
        return None


def recognize_face(
    contents: bytes,
    enrolled: list,
) -> List[MatchResult]:
    try:
        img = _bytes_to_cv2(contents)
        query_objs = DeepFace.represent(
            img_path=img,
            model_name=MODEL_NAME,
            detector_backend=DETECTOR,
            enforce_detection=True,
        )
        if not query_objs:
            return []

        query_embedding = np.array(query_objs[0]["embedding"])
        results = []

        for record in enrolled:
            stored = np.array(record.embedding)
            dot = np.dot(query_embedding, stored)
            norm = np.linalg.norm(query_embedding) * np.linalg.norm(stored)
            similarity = float(dot / norm) if norm > 0 else 0.0
            confidence = round((similarity + 1) / 2 * 100, 2)

            if confidence >= CONFIDENCE_THRESHOLD:
                results.append(
                    MatchResult(
                        label=record.label,
                        confidence=confidence,
                        image_url=record.image_url,
                        face_id=record.id,
                    )
                )

        results.sort(key=lambda x: x.confidence, reverse=True)
        return results

    except Exception:
        return []


def delete_face_data(face_id: str) -> None:
    pass
