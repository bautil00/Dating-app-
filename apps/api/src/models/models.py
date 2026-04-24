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


from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime


# =========================
# ENUMS
# =========================

class Pronouns(str, Enum):
    HE_HIM = "he_him"
    SHE_HER = "she_her"
    THEY_THEM = "they_them"


class SexualPref(str, Enum):
    STRAIGHT = "straight"
    GAY = "gay"
    BISEXUAL = "bisexual"
    PANSEXUAL = "pansexual"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    NON_BINARY = "non_binary"
    MTF = "mtf"
    FTM = "ftm"


class BodyType(str, Enum):
    SLIM = "slim"
    AVERAGE = "average"
    LARGE = "large"
    MUSCULAR = "muscular"


class RelationshipStatus(str, Enum):
    SINGLE = "single"
    TAKEN = "taken"
    MARRIED = "married"


class Ethnicity(str, Enum):
    ASIAN = "asian"
    BLACK = "black"
    WHITE = "white"
    LATINO = "latino"


class Interest(str, Enum):
    CARS = "cars"
    MUSIC = "music"
    ART = "art"
    GAMING = "gaming"
    PROGRAMMING = "programming"
    SPORTS = "sports"


class JobType(str, Enum):
    PROGRAMMER = "programmer"
    SECURITY = "security"
    MEDICAL = "medical"


class Zodiac(str, Enum):
    ARIES = "aries"
    TAURUS = "taurus"
    GEMINI = "gemini"


class Language(str, Enum):
    ENGLISH = "english"
    SPANISH = "spanish"
    JAPANESE = "japanese"


class Color(str, Enum):
    BLACK = "black"
    BLUE = "blue"
    BROWN = "brown"


class Education(str, Enum):
    NONE = "none"
    BACHELORS = "bachelors"
    MASTERS = "masters"


class SocialPlatform(str, Enum):
    DISCORD = "discord"
    INSTAGRAM = "instagram"
    SNAPCHAT = "snapchat"


class Day(str, Enum):
    FRI = "fri"
    SAT = "sat"
    SUN = "sun"


class MBTI(str, Enum):
    INFP = "infp"
    ENTP = "entp"
    INTJ = "intj"


# =========================
# TABLE MODEL
# =========================

@dataclass
class UserData:
    id: Optional[int] = None
    created_at: datetime = field(default_factory=datetime.utcnow)

    user_id: Optional[str] = None

    name: str = "NoName"
    age: int = 0

    location: Optional[float] = None
    height: Optional[float] = None
    weight: Optional[int] = None

    # Array columns
    interests: List[Interest] = field(default_factory=list)
    languages: List[Language] = field(default_factory=list)
    socials: List[SocialPlatform] = field(default_factory=list)
    availability: List[Day] = field(default_factory=list)

    # Single enums
    job: Optional[JobType] = None
    pronouns: Optional[Pronouns] = None
    sexual_pref: Optional[SexualPref] = None
    gender: Optional[Gender] = None

    body: Optional[BodyType] = None
    relationship: Optional[RelationshipStatus] = None
    race: Optional[Ethnicity] = None

    zodiac: Optional[Zodiac] = None
    education: Optional[Education] = None

    hair_color: Optional[Color] = None
    eye_color: Optional[Color] = None

    mbti: Optional[MBTI] = None

    glasses: bool = False
    kids: bool = False
    pets: bool = False
    drives: bool = False

    is_complete: bool = False
    compatibility_score: float = 0.0

    seeking_gender: str = "everyone"
    max_distance_km: int = 50


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
