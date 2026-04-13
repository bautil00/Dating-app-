from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.models import Profile, Message
from ..schemas.schemas import MessageCreate, MessageResponse
from ..services.supabase_client import get_supabase

router = APIRouter(prefix="/messages", tags=["Messages"])


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


@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    message: MessageCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    receiver = db.query(Profile).filter(Profile.user_id == message.receiver_id).first()
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recipient not found"
        )

    db_message = Message(
        sender_id=user_id,
        receiver_id=message.receiver_id,
        content=message.content,
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


@router.get("/conversations/{target_user_id}", response_model=List[MessageResponse])
def get_conversation(
    target_user_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    messages = (
        db.query(Message)
        .filter(
            ((Message.sender_id == user_id) & (Message.receiver_id == target_user_id))
            | ((Message.sender_id == target_user_id) & (Message.receiver_id == user_id))
        )
        .order_by(Message.created_at)
        .all()
    )
    return messages


@router.get("/conversations", response_model=List[dict])
def get_all_conversations(
    user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)
):
    sent = db.query(Message).filter(Message.sender_id == user_id).all()
    received = db.query(Message).filter(Message.receiver_id == user_id).all()

    user_ids = set()
    for msg in sent + received:
        user_ids.add(msg.receiver_id if msg.sender_id == user_id else msg.sender_id)

    conversations = []
    for uid in user_ids:
        last_msg = (
            db.query(Message)
            .filter(
                ((Message.sender_id == user_id) & (Message.receiver_id == uid))
                | ((Message.sender_id == uid) & (Message.receiver_id == user_id))
            )
            .order_by(Message.created_at.desc())
            .first()
        )
        unread = (
            db.query(Message)
            .filter(
                Message.sender_id == uid,
                Message.receiver_id == user_id,
                Message.is_read == False,
            )
            .count()
        )
        conversations.append(
            {
                "user_id": uid,
                "last_message": last_msg.content if last_msg else None,
                "last_timestamp": last_msg.created_at if last_msg else None,
                "unread_count": unread,
            }
        )
    return conversations


@router.patch("/{message_id}/read", response_model=MessageResponse)
def mark_as_read(
    message_id: int,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Message not found"
        )
    if message.receiver_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )

    message.is_read = True
    db.commit()
    db.refresh(message)
    return message
