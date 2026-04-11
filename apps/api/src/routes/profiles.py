from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.models import User, Profile
from ..schemas.schemas import ProfileCreate, ProfileUpdate, ProfileResponse
from ..services.auth_service import get_current_user
from ..services.recommendation_service import recommendation_service

router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
def create_profile(
    profile: ProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Profile already exists"
        )

    db_profile = Profile(user_id=current_user.id, **profile.model_dump())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )
    return profile


@router.patch("/me", response_model=ProfileResponse)
def update_my_profile(
    profile_update: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    my_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not my_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Create profile first"
        )

    all_profiles = db.query(Profile).filter(Profile.user_id != current_user.id).all()
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
