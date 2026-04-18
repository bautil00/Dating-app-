from fastapi import FastAPI, APIRouter, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import Optional

app = FastAPI(title="BLOWTORCH", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = "https://meoeszlzwmjreelusizu.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lb2Vzemx6d21qcmVlbHVzaXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTA3ODYsImV4cCI6MjA5MjAyNjc4Nn0.fc_KhHltSzCMhH46TH9kZA-uIezhQztUqrMvXifs7go"


def get_supabase_client():
    return httpx.Client(base_url=SUPABASE_URL, headers={"apikey": SUPABASE_KEY})


auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/register")
def register(user: dict):
    with get_supabase_client() as client:
        response = client.post("/auth/v1/signup", json=user)
        if response.status_code >= 400:
            raise HTTPException(status_code=400, detail=response.text)
        return response.json()


@auth_router.post("/login")
def login(user: dict):
    with get_supabase_client() as client:
        response = client.post("/auth/v1/token?grant_type=password", json=user)
        if response.status_code >= 400:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return response.json()


@auth_router.get("/me")
def me(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = authorization.replace("Bearer ", "").strip()
    with get_supabase_client() as client:
        response = client.get("/auth/v1/user", headers={"Authorization": f"Bearer {token}"})
        if response.status_code >= 400:
            raise HTTPException(status_code=401, detail="Invalid token")
        return response.json()


app.include_router(auth_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "BLOWTORCH API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}