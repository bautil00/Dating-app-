from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Text,
    Float,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, unique=True, nullable=False, index=True)
    display_name = Column(String, index=True)
    bio = Column(Text)
    age = Column(Integer)
    gender = Column(String)
    location = Column(String)
    profile_image_url = Column(String)
    interests = Column(Text)
    personality_type = Column(String)
    compatibility_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(String, ForeignKey("profiles.user_id"), nullable=False)
    receiver_id = Column(String, ForeignKey("profiles.user_id"), nullable=False)
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(String, ForeignKey("profiles.user_id"), nullable=False)
    receiver_id = Column(String, ForeignKey("profiles.user_id"), nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
