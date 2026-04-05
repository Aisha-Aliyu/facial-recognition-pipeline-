import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Boolean,
    Text, ForeignKey, Integer, Float, Index
)
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_id = Column(String(255), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    face_profiles = relationship("FaceProfile", back_populates="user", cascade="all, delete-orphan")
    recognition_logs = relationship("RecognitionLog", back_populates="user", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_users_clerk_email", "clerk_id", "email"),
    )


class FaceProfile(Base):
    __tablename__ = "face_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    label = Column(String(255), nullable=False)
    image_url = Column(Text, nullable=False)
    cloudinary_public_id = Column(String(255), nullable=False)
    embedding = Column(ARRAY(Float), nullable=False)
    model_used = Column(String(100), default="Facenet512")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="face_profiles")
    recognition_logs = relationship("RecognitionLog", back_populates="face_profile")

    __table_args__ = (
        Index("ix_face_profiles_user_label", "user_id", "label"),
    )


class RecognitionLog(Base):
    __tablename__ = "recognition_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    face_profile_id = Column(UUID(as_uuid=True), ForeignKey("face_profiles.id", ondelete="SET NULL"), nullable=True)
    query_image_url = Column(Text, nullable=True)
    matched = Column(Boolean, default=False)
    confidence = Column(Float, nullable=True)
    distance = Column(Float, nullable=True)
    model_used = Column(String(100), default="Facenet512")
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="recognition_logs")
    face_profile = relationship("FaceProfile", back_populates="recognition_logs")

    __table_args__ = (
        Index("ix_recognition_logs_user_created", "user_id", "created_at"),
    )
