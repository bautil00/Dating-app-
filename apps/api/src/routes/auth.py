from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import httpx
from ..config import get_settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


def get_supabase_settings():
    from ..config import get_settings

    return get_settings()


@router.post("/register")
def register(user: dict):
    settings = get_supabase_settings()
    try:
        with httpx.Client() as client:
            response = client.post(
                f"{settings.supabase_url}/auth/v1/signup",
                json={"email": user["email"], "password": user["password"]},
                headers={
                    "apikey": settings.supabase_key,
                    "Content-Type": "application/json",
                },
            )
            if response.status_code >= 400:
                raise HTTPException(status_code=400, detail=response.text)
            data = response.json()
            if "user" in data:
                return {"id": data["user"]["id"], "email": data["user"]["email"]}
            return {"id": "pending", "email": user["email"]}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login")
def login(user: dict):
    settings = get_supabase_settings()
    try:
        with httpx.Client() as client:
            response = client.post(
                f"{settings.supabase_url}/auth/v1/token?grant_type=password",
                json={"email": user["email"], "password": user["password"]},
                headers={
                    "apikey": settings.supabase_key,
                    "Content-Type": "application/json",
                },
            )
            if response.status_code >= 400:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials",
                )
            data = response.json()
            return {
                "access_token": data.get("access_token", ""),
                "token_type": "bearer",
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
