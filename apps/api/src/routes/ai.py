from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import User, Profile
from ..schemas.schemas import ProfileResponse
from ..services.auth_service import get_current_user
from ..services.recommendation_service import recommendation_service

router = APIRouter(prefix="/ai", tags=["AI Features"])


@router.get("/icebreaker/{match_id}")
def get_icebreaker(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from ..models.models import Match

    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found"
        )

    user_ids = [match.sender_id, match.receiver_id]
    profiles = db.query(Profile).filter(Profile.user_id.in_(user_ids)).all()

    if len(profiles) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Both users need profiles"
        )

    my_profile = next((p for p in profiles if p.user_id == current_user.id), None)
    their_profile = next((p for p in profiles if p.user_id != current_user.id), None)

    if not my_profile or not their_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Create your profile first"
        )

    icebreaker = recommendation_service.generate_icebreaker(
        {"interests": my_profile.interests}, {"interests": their_profile.interests}
    )

    return {"icebreaker": icebreaker}


@router.get("/compatibility/{profile_id}")
def get_compatibility_score(
    profile_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    my_profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    if not my_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Create your profile first"
        )

    their_profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not their_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    score = recommendation_service.calculate_compatibility_score(
        my_profile.interests or "",
        my_profile.personality_type or "",
        their_profile.interests or "",
        their_profile.personality_type or "",
    )

    return {"profile_id": profile_id, "compatibility_score": score}
