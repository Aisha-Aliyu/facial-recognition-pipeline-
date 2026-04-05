from pydantic import BaseModel, EmailStr, UUID4, Field
from datetime import datetime
from typing import Optional, List


class UserCreate(BaseModel):
    clerk_id: str
    email: EmailStr
    full_name: Optional[str] = None


class UserOut(BaseModel):
    id: UUID4
    clerk_id: str
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class FaceEnrollRequest(BaseModel):
    label: str = Field(..., min_length=1, max_length=100, description="Name or label for this face")


class FaceProfileOut(BaseModel):
    id: UUID4
    label: str
    image_url: str
    model_used: str
    created_at: datetime

    class Config:
        from_attributes = True


class RecognitionResult(BaseModel):
    matched: bool
    confidence: Optional[float]
    distance: Optional[float]
    label: Optional[str]
    face_profile_id: Optional[UUID4]
    message: str


class RecognitionLogOut(BaseModel):
    id: UUID4
    matched: bool
    confidence: Optional[float]
    label: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedFaceProfiles(BaseModel):
    items: List[FaceProfileOut]
    total: int
    page: int
    per_page: int


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
