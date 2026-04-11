from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.models import User, Profile, Match
from ..schemas.schemas import MatchCreate, MatchResponse
from ..services.auth_service import get_current_user

router = APIRouter(prefix="/matches", tags=["Matches"])


@router.post("/", response_model=MatchResponse, status_code=status.HTTP_201_CREATED)
def create_match(
    match_data: MatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if match_data.receiver_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot match with yourself"
        )

    receiver = db.query(User).filter(User.id == match_data.receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    existing = (
        db.query(Match)
        .filter(
            Match.sender_id == current_user.id,
            Match.receiver_id == match_data.receiver_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Match already exists"
        )

    match = Match(sender_id=current_user.id, receiver_id=match_data.receiver_id)
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


@router.get("/", response_model=List[MatchResponse])
def get_my_matches(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    matches = (
        db.query(Match)
        .filter(
            (Match.sender_id == current_user.id)
            | (Match.receiver_id == current_user.id)
        )
        .all()
    )
    return matches


@router.patch("/{match_id}/accept", response_model=MatchResponse)
def accept_match(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found"
        )
    if match.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    match.status = "accepted"
    db.commit()
    db.refresh(match)
    return match


@router.patch("/{match_id}/reject", response_model=MatchResponse)
def reject_match(
    match_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Match not found"
        )
    if match.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    match.status = "rejected"
    db.commit()
    db.refresh(match)
    return match
