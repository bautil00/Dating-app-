from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from ..services.supabase_client import get_supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str


class Token(BaseModel):
    access_token: str
    token_type: str


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(user: UserCreate):
    supabase = get_supabase()
    try:
        auth_response = supabase.auth.sign_up(
            {
                "email": user.email,
                "password": user.password,
            }
        )
        return {"id": auth_response.user.id, "email": auth_response.user.email}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=Token)
def login(user: UserCreate):
    supabase = get_supabase()
    try:
        auth_response = supabase.auth.sign_in_with_password(
            {
                "email": user.email,
                "password": user.password,
            }
        )
        return {
            "access_token": auth_response.session.access_token,
            "token_type": "bearer",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )


@router.get("/me", response_model=UserResponse)
def get_me(token: str):
    supabase = get_supabase()
    try:
        user = supabase.auth.get_user(token)
        return {"id": user.user.id, "email": user.user.email}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
