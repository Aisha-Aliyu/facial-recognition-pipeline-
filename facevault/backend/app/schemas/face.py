from pydantic import BaseModel, field_validator
from typing import List, Optional
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


class LogOut(BaseModel):
    id: str
    matched: bool
    label: Optional[str] = None
    confidence: Optional[float] = None
    created_at: datetime

    class Config:
        from_attributes = True

    # A database can hold this id as uuid or as text, so always send it as text
    @field_validator("id", mode="before")
    @classmethod
    def id_as_text(cls, v):
        return str(v)


class EmbeddingOut(BaseModel):
    embedding: List[float]
