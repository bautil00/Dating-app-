from fastapi import FastAPI, APIRouter, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import Optional
import math
from .config import get_settings

app = FastAPI(title="BLOWTORCH", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://web-two-beta-72.vercel.app",
        "http://localhost:5173",
        "http://localhost:4000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
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
def like_candidate(data: dict, authorization: str = Header(None)):
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

    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")

    token = authorization.replace("Bearer ", "").strip()
    
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
                my_interests = my_profile.get('interests', '')
                cand_interests = candidate.get('interests', '')
                
                prompt = f"""Rate compatibility between these two people from 0-100:
Person A interests: {my_interests}
Person B interests: {cand_interests}

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
                        except (ValueError, TypeError):
                            pass
                except Exception:
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


profiles_router = APIRouter(prefix="/profiles", tags=["Profiles"])


def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def filter_by_gender(profiles, seeking):
    if not seeking or seeking == 'everyone':
        return profiles
    if seeking == 'both':
        return [p for p in profiles if p.get('gender') in ['Male', 'Female']]
    return [p for p in profiles if p.get('gender', '').lower() == seeking.lower()]


def calculate_compatibility(user_interests, candidate_interests):
    if not user_interests or not candidate_interests:
        return 50.0
    user_int = str(user_interests).lower() if not isinstance(user_interests, list) else user_interests[0].lower() if user_interests else ""
    cand_int = str(candidate_interests).lower() if not isinstance(candidate_interests, list) else candidate_interests[0].lower() if candidate_interests else ""
    if user_int == cand_int:
        return 100.0
    return 30.0


@profiles_router.get("/me")
def get_my_profile(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization.replace("Bearer ", "")
    settings = get_settings()
    
    with httpx.Client() as client:
        user_resp = client.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={"apikey": settings.supabase_key, "Authorization": f"Bearer {token}"}
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = user_resp.json().get("id")
        
        resp = client.get(
            f"{settings.supabase_url}/rest/v1/UserData",
            params={"user_id": f"eq.{user_id}"},
            headers={"apikey": settings.supabase_key}
        )
        profiles = resp.json()
        if profiles:
            return profiles[0]
        return {"user_id": user_id, "is_complete": False}


@profiles_router.get("/candidates")
def get_candidates(limit: int = 10, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization.replace("Bearer ", "")
    settings = get_settings()
    
    with httpx.Client() as client:
        me_resp = client.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={"apikey": settings.supabase_key, "Authorization": f"Bearer {token}"}
        )
        user_id = me_resp.json().get("id")
        
        my_resp = client.get(
            f"{settings.supabase_url}/rest/v1/UserData",
            params={"user_id": f"eq.{user_id}"},
            headers={"apikey": settings.supabase_key}
        )
        if not my_resp.json():
            raise HTTPException(status_code=404, detail="Create profile first")
        my_profile = my_resp.json()[0]
        
        all_resp = client.get(
            f"{settings.supabase_url}/rest/v1/UserData",
            params={"is_complete": "eq.true"},
            headers={"apikey": settings.supabase_key}
        )
        
        candidates = [c for c in all_resp.json() if c.get('user_id') != user_id]
        if not candidates:
            return []
        
        seeking = my_profile.get('seeking_gender', 'everyone')
        filtered = filter_by_gender(candidates, seeking)
        
        for c in filtered:
            my_int = my_profile.get('interests', '')
            c_int = c.get('interests', '')
            c['compatibility_score'] = calculate_compatibility(my_int, c_int)
        
        filtered.sort(key=lambda x: x.get('compatibility_score', 0), reverse=True)
        return filtered[:limit]


@profiles_router.post("/")
def create_profile(profile_data: dict, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization.replace("Bearer ", "")
    settings = get_settings()
    
    with httpx.Client() as client:
        me_resp = client.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={"apikey": settings.supabase_key, "Authorization": f"Bearer {token}"}
        )
        user_id = me_resp.json().get("id")
        
        # Location column is double precision (latitude) in DB, not text
        location_val = profile_data.get('location')
        try:
            location_num = float(location_val) if location_val else None
        except (ValueError, TypeError):
            location_num = None

        mapped = {
            'Name': profile_data.get('display_name'),
            'Age': profile_data.get('age'),
            'Location': location_num,
            'interests': profile_data.get('interests', 'Music'),
            'gender': profile_data.get('gender'),
            'seeking_gender': profile_data.get('seeking_gender', 'everyone'),
            'max_distance_km': profile_data.get('max_distance_km', 50),
            'is_complete': True,
            'user_id': user_id,
        }
        # Remove None values to avoid overwriting with nulls
        mapped = {k: v for k, v in mapped.items() if v is not None}
        
        existing = client.get(
            f"{settings.supabase_url}/rest/v1/UserData",
            params={"user_id": f"eq.{user_id}"},
            headers={"apikey": settings.supabase_key}
        )
        if existing.json():
            client.patch(
                f"{settings.supabase_url}/rest/v1/UserData",
                params={"user_id": f"eq.{user_id}"},
                json=mapped,
                headers={"apikey": settings.supabase_key, "Content-Type": "application/json"}
            )
            return {"status": "updated", "user_id": user_id}
        
        result = client.post(
            f"{settings.supabase_url}/rest/v1/UserData",
            json=mapped,
            headers={"apikey": settings.supabase_key, "Content-Type": "application/json"}
        )
        return result.json()


app.include_router(profiles_router, prefix="/api/v1")


# ---- Matches Routes (Supabase REST) ----
matches_router = APIRouter(prefix="/matches", tags=["Matches"])


def _get_user_id(authorization: str, settings):
    """Extract user_id from Bearer token via Supabase."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization.replace("Bearer ", "").strip()
    with httpx.Client() as client:
        resp = client.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={"apikey": settings.supabase_key, "Authorization": f"Bearer {token}"}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        return resp.json().get("id")


@matches_router.get("/")
def get_my_matches(authorization: str = Header(None)):
    settings = get_settings()
    user_id = _get_user_id(authorization, settings)
    with httpx.Client() as client:
        sent = client.get(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"sender_user_id": f"eq.{user_id}", "order": "created_at.desc"},
            headers={"apikey": settings.supabase_key}
        ).json()
        received = client.get(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"receiver_user_id": f"eq.{user_id}", "order": "created_at.desc"},
            headers={"apikey": settings.supabase_key}
        ).json()
        all_matches = sent + received
        for m in all_matches:
            m["sender_id"] = m.get("sender_user_id", "")
            m["receiver_id"] = m.get("receiver_user_id", "")
        return all_matches


@matches_router.patch("/{match_id}/accept")
def accept_match(match_id: int, authorization: str = Header(None)):
    settings = get_settings()
    user_id = _get_user_id(authorization, settings)
    with httpx.Client() as client:
        match_resp = client.get(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"id": f"eq.{match_id}"},
            headers={"apikey": settings.supabase_key}
        )
        matches = match_resp.json()
        if not matches:
            raise HTTPException(status_code=404, detail="Match not found")
        match = matches[0]
        if match.get("receiver_user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        client.patch(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"id": f"eq.{match_id}"},
            json={"status": "accepted"},
            headers={"apikey": settings.supabase_key, "Content-Type": "application/json"}
        )
        match["status"] = "accepted"
        return match


@matches_router.patch("/{match_id}/reject")
def reject_match(match_id: int, authorization: str = Header(None)):
    settings = get_settings()
    user_id = _get_user_id(authorization, settings)
    with httpx.Client() as client:
        match_resp = client.get(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"id": f"eq.{match_id}"},
            headers={"apikey": settings.supabase_key}
        )
        matches = match_resp.json()
        if not matches:
            raise HTTPException(status_code=404, detail="Match not found")
        match = matches[0]
        if match.get("receiver_user_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        client.patch(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"id": f"eq.{match_id}"},
            json={"status": "rejected"},
            headers={"apikey": settings.supabase_key, "Content-Type": "application/json"}
        )
        return {"status": "rejected"}


app.include_router(matches_router, prefix="/api/v1")


# ---- Messages Routes (Supabase REST) ----
messages_router = APIRouter(prefix="/messages", tags=["Messages"])


@messages_router.post("/")
def send_message(data: dict, authorization: str = Header(None)):
    settings = get_settings()
    user_id = _get_user_id(authorization, settings)
    receiver_id = data.get("receiver_id")
    content = data.get("content", "").strip()
    if not receiver_id or not content:
        raise HTTPException(status_code=400, detail="receiver_id and content required")
    with httpx.Client() as client:
        resp = client.post(
            f"{settings.supabase_url}/rest/v1/messages",
            json={"sender_id": user_id, "receiver_id": receiver_id, "content": content},
            headers={
                "apikey": settings.supabase_key,
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            }
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        messages = resp.json()
        return messages[0] if messages else {"sender_id": user_id, "receiver_id": receiver_id, "content": content}


@messages_router.get("/conversations/{target_user_id}")
def get_conversation(target_user_id: str, authorization: str = Header(None)):
    settings = get_settings()
    user_id = _get_user_id(authorization, settings)
    with httpx.Client() as client:
        sent = client.get(
            f"{settings.supabase_url}/rest/v1/messages",
            params={
                "sender_id": f"eq.{user_id}",
                "receiver_id": f"eq.{target_user_id}",
                "order": "created_at.asc",
            },
            headers={"apikey": settings.supabase_key}
        ).json()
        received = client.get(
            f"{settings.supabase_url}/rest/v1/messages",
            params={
                "sender_id": f"eq.{target_user_id}",
                "receiver_id": f"eq.{user_id}",
                "order": "created_at.asc",
            },
            headers={"apikey": settings.supabase_key}
        ).json()
        all_msgs = sent + received
        all_msgs.sort(key=lambda m: m.get("created_at", ""))
        return all_msgs


@messages_router.get("/conversations")
def get_all_conversations(authorization: str = Header(None)):
    settings = get_settings()
    user_id = _get_user_id(authorization, settings)
    with httpx.Client() as client:
        sent = client.get(
            f"{settings.supabase_url}/rest/v1/messages",
            params={"sender_id": f"eq.{user_id}", "order": "created_at.desc"},
            headers={"apikey": settings.supabase_key}
        ).json()
        received = client.get(
            f"{settings.supabase_url}/rest/v1/messages",
            params={"receiver_id": f"eq.{user_id}", "order": "created_at.desc"},
            headers={"apikey": settings.supabase_key}
        ).json()
        user_ids = set()
        for m in sent:
            user_ids.add(m["receiver_id"])
        for m in received:
            user_ids.add(m["sender_id"])
        conversations = []
        all_msgs = sent + received
        for uid in user_ids:
            msgs = [m for m in all_msgs if m.get("sender_id") == uid or m.get("receiver_id") == uid]
            msgs.sort(key=lambda m: m.get("created_at", ""), reverse=True)
            last = msgs[0] if msgs else None
            unread = sum(1 for m in received if m.get("sender_id") == uid and not m.get("is_read"))
            conversations.append({
                "user_id": uid,
                "last_message": last.get("content") if last else None,
                "last_timestamp": last.get("created_at") if last else None,
                "unread_count": unread,
            })
        return conversations


app.include_router(messages_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "BLOWTORCH API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}