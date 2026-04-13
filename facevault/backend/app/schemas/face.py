from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class FaceOut(BaseModel):
    id: str
    label: str
    image_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class MatchResult(BaseModel):
    id: str
    label: str
    image_url: Optional[str] = None
    confidence: float
