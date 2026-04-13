from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.models import Profile
from ..schemas.schemas import ProfileCreate, ProfileUpdate, ProfileResponse
from ..services.recommendation_service import recommendation_service
from ..services.supabase_client import get_supabase

router = APIRouter(prefix="/profiles", tags=["Profiles"])


def get_current_user_id(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid token"
        )
    token = authorization.replace("Bearer ", "")
    supabase = get_supabase()
    try:
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )


@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(
    profile: ProfileCreate,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    existing = db.query(Profile).filter(Profile.user_id == user_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Profile already exists"
        )

    db_profile = Profile(user_id=user_id, **profile.model_dump())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return profile


@router.patch("/me", response_model=ProfileResponse)
def update_my_profile(
    profile_update: ProfileUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    for field, value in profile_update.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/candidates", response_model=List[ProfileResponse])
def get_candidates(
    limit: int = 10,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    my_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not my_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Create profile first"
        )

    all_profiles = db.query(Profile).filter(Profile.user_id != user_id).all()
    candidate_profiles = [
        {
            "interests": p.interests,
            "personality_type": p.personality_type,
            "id": p.id,
            "user_id": p.user_id,
            "display_name": p.display_name,
            "bio": p.bio,
            "age": p.age,
            "gender": p.gender,
            "location": p.location,
            "profile_image_url": p.profile_image_url,
        }
        for p in all_profiles
    ]

    ranked = recommendation_service.rank_candidates(
        {
            "interests": my_profile.interests,
            "personality_type": my_profile.personality_type,
        },
        candidate_profiles,
        limit=limit,
    )

    profile_ids = [c["id"] for c in ranked]
    profiles = db.query(Profile).filter(Profile.id.in_(profile_ids)).all()
    profiles.sort(key=lambda x: profile_ids.index(x.id))
    return profiles


@router.get("/{profile_id}", response_model=ProfileResponse)
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return profile
