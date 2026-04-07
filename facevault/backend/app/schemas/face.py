from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class FaceOut(BaseModel):
    id: str
    label: str
    image_url: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}


class MatchResult(BaseModel):
    label: str
    confidence: float
    image_url: Optional[str]
    face_id: str
