import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class FaceRecord(Base):
    __tablename__ = "face_records"

    id = Column(UUID(as_uuid=False), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(100), nullable=False)
    embedding = Column(JSON, nullable=False)
    image_url = Column(String(500), nullable=True)
    cloudinary_public_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="faces")
