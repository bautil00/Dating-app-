from fastapi import FastAPI, APIRouter, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import Optional
from .config import get_settings

app = FastAPI(title="BLOWTORCH", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_supabase_client():
    settings = get_settings()
    return httpx.Client(base_url=settings.supabase_url, headers={"apikey": settings.supabase_key})


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


match_router = APIRouter(prefix="/match", tags=["Match"])


def get_user_from_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token = authorization.replace("Bearer ", "").strip()
    settings = get_settings()
    with httpx.Client() as client:
        response = client.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={"apikey": settings.supabase_key, "Authorization": f"Bearer {token}"}
        )
        if response.status_code >= 400:
            raise HTTPException(status_code=401, detail="Invalid token")
        return response.json()


@match_router.post("/")
def like_candidate(data: dict):
    """
    Like a candidate. Flow:
    1. Get current user's profile & preferences
    2. Get candidate's profile
    3. Call OpenRouter to score compatibility (if API key exists)
    4. Save match to database
    5. Return if it's a match (both liked each other)
    """
    settings = get_settings()
    candidate_id = data.get("candidate_id")
    
    if not candidate_id:
        raise HTTPException(status_code=400, detail="candidate_id required")
    
    auth_header = data.get("auth_header")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing authorization")
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        with httpx.Client() as client:
            me_resp = client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={"apikey": settings.supabase_key, "Authorization": f"Bearer {token}"}
            )
            my_user = me_resp.json()
            my_id = my_user.get("id")
            
            my_profile_resp = client.get(
                f"{settings.supabase_url}/rest/v1/UserData",
                params={"user_id": f"eq.{my_id}"},
                headers={"apikey": settings.supabase_key}
            )
            my_profile = my_profile_resp.json()[0] if my_profile_resp.json() else {}
            
            candidate_resp = client.get(
                f"{settings.supabase_url}/rest/v1/UserData",
                params={"user_id": f"eq.{candidate_id}"},
                headers={"apikey": settings.supabase_key}
            )
            candidate = candidate_resp.json()[0] if candidate_resp.json() else None
            
            if not candidate:
                raise HTTPException(status_code=404, detail="Candidate not found")
            
            compatibility_score = 50.0
            if settings.openrouter_api_key and my_profile and candidate:
                my_interests = f"{my_profile.get('interest_1', '')},{my_profile.get('interest_2', '')},{my_profile.get('interest_3', '')}"
                cand_interests = f"{candidate.get('interest_1', '')},{candidate.get('interest_2', '')},{candidate.get('interest_3', '')}"
                
                prompt = f"""Rate compatibility between these two people from 0-100:
Person A: {my_interests}
Person B: {cand_interests}

Respond with just a number:"""
                
                try:
                    or_resp = client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        json={
                            "model": "openai/gpt-3.5-turbo",
                            "messages": [{"role": "user", "content": prompt}],
                            "max_tokens": 5
                        },
                        headers={"Authorization": f"Bearer {settings.openrouter_api_key}", "Content-Type": "application/json"}
                    )
                    if or_resp.status_code == 200:
                        content = or_resp.json().get("choices", [{}])[0].get("message", {}).get("content", "")
                        try:
                            compatibility_score = float(content.strip())
                        except:
                            pass
                except:
                    pass
            
            save_resp = client.post(
                f"{settings.supabase_url}/rest/v1/matches",
                json={
                    "sender_user_id": my_id,
                    "receiver_user_id": candidate_id,
                    "status": "pending",
                    "compatibility_score": compatibility_score
                },
                headers={"apikey": settings.supabase_key, "Content-Type": "application/json"}
            )
            
            is_match = False
            existing_like = client.get(
                f"{settings.supabase_url}/rest/v1/matches",
                params={"sender_user_id": f"eq.{candidate_id}", "receiver_user_id": f"eq.{my_id}"},
                headers={"apikey": settings.supabase_key}
            )
            
            if existing_like.json():
                existing = existing_like.json()[0]
                if existing.get("status") == "pending":
                    is_match = True
                    client.patch(
                        f"{settings.supabase_url}/rest/v1/matches",
                        params={"sender_user_id": f"eq.{candidate_id}", "receiver_user_id": f"eq.{my_id}"},
                        json={"status": "matched"},
                        headers={"apikey": settings.supabase_key, "Content-Type": "application/json"}
                    )
            
            return {"matched": is_match, "candidate_id": candidate_id, "status": "liked", "compatibility_score": compatibility_score}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


app.include_router(match_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "BLOWTORCH API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}