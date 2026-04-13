from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.models import Profile
from ..services.supabase_client import get_supabase
from ..services.openai_service import openai_service
from ..services.recommendation_service import recommendation_service

router = APIRouter(prefix="/ai", tags=["AI Features"])


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


@router.get("/icebreaker/{match_id}")
def get_icebreaker(
    match_id: int,
    user_id: str = Depends(get_current_user_id),
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

    my_profile = next((p for p in profiles if p.user_id == user_id), None)
    their_profile = next((p for p in profiles if p.user_id != user_id), None)

    if not my_profile or not their_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Create your profile first"
        )

    try:
        icebreaker = openai_service.generate_icebreaker(
            {"interests": my_profile.interests or ""},
            {"interests": their_profile.interests or ""},
        )
    except Exception as e:
        icebreaker = recommendation_service.generate_icebreaker(
            {"interests": my_profile.interests or ""},
            {"interests": their_profile.interests or ""},
        )

    return {"icebreaker": icebreaker}


@router.get("/compatibility/{profile_id}")
def get_compatibility_score(
    profile_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    my_profile = db.query(Profile).filter(Profile.user_id == user_id).first()
    if not my_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Create your profile first"
        )

    their_profile = db.query(Profile).filter(Profile.id == profile_id).first()
    if not their_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found"
        )

    try:
        score = openai_service.calculate_compatibility_score(
            my_profile.interests or "",
            my_profile.personality_type or "",
            their_profile.interests or "",
            their_profile.personality_type or "",
        )
    except Exception:
        score = recommendation_service.calculate_compatibility_score(
            my_profile.interests or "",
            my_profile.personality_type or "",
            their_profile.interests or "",
            their_profile.personality_type or "",
        )

    return {"profile_id": profile_id, "compatibility_score": score}
