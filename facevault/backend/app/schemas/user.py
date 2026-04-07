from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    clerk_id: str
    email: str
    name: Optional[str] = None


class UserOut(BaseModel):
    id: str
    clerk_id: str
    email: str
    name: Optional[str]
    created_at: Optional[datetime]

    model_config = {"from_attributes": True}
