from fastapi import FastAPI, APIRouter, HTTPException, Header, Request
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import Optional
import math
import json
import re
import os
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from .config import get_settings

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app = FastAPI(title="BLOWTORCH", version="0.1.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://web-two-beta-72.vercel.app",
        "http://localhost:5173",
        "http://localhost:4000",
        "null",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
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
def like_candidate(data: dict, authorization: str = Header(None)):
    settings = get_settings()
    candidate_id = data.get("candidate_id") or data.get("receiver_id")
    if not candidate_id:
        raise HTTPException(status_code=400, detail="candidate_id required")

    user_id, token = _get_user_id_and_token(authorization, settings)
    result = _create_or_update_match(
        settings=settings,
        token=token,
        sender_id=user_id,
        receiver_id=str(candidate_id),
    )
    return {
        "matched": result["matched"],
        "candidate_id": str(candidate_id),
        "status": "liked",
        "match_id": result.get("id"),
        "compatibility_score": result.get("compatibility_score"),
    }


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
    return [p for p in profiles if (p.get('gender') or '').lower() == seeking.lower()]


def _coerce_interests_text(val) -> str:
    if val is None:
        return ""
    if isinstance(val, list):
        parts = [str(x).strip() for x in val if x is not None and str(x).strip()]
        return ", ".join(parts)
    return str(val).strip()


def interests_from_profile(profile: dict) -> str:
    """Single string for LLM scoring. Handles null `interests` and legacy interest_1..3."""
    if not profile:
        return ""
    combined = _coerce_interests_text(profile.get("interests"))
    if combined:
        return combined
    parts = []
    for key in ("interest_1", "interest_2", "interest_3"):
        part = _coerce_interests_text(profile.get(key))
        if part:
            parts.append(part)
    return ", ".join(parts)


def calculate_compatibility(user_interests, candidate_interests):
    user_interests = _coerce_interests_text(user_interests)
    candidate_interests = _coerce_interests_text(candidate_interests)
    if not user_interests or not candidate_interests:
        return 50.0
    
    settings = get_settings()
    if settings.openrouter_api_key:
        prompt = f"You are a dating compatibility AI. Given two profiles' interests, return ONLY a single integer score between 0 and 100 representing their compatibility. Do not include any explanation or additional text. Profile 1 interests: {user_interests}. Profile 2 interests: {candidate_interests}."
        try:
            with httpx.Client() as client:
                resp = client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    json={
                        "model": "tencent/hy3-preview:free",
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 20,
                    },
                    headers={
                        "Authorization": f"Bearer {settings.openrouter_api_key}",
                        "Content-Type": "application/json",
                    },
                    timeout=10
                )
                if resp.status_code == 200:
                    content = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                    match = re.search(r'\d+', content)
                    if match:
                        return float(match.group())
        except Exception:
            pass

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
            f"{settings.supabase_url}/rest/v1/user_data",
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
            f"{settings.supabase_url}/rest/v1/user_data",
            params={"user_id": f"eq.{user_id}"},
            headers={"apikey": settings.supabase_key}
        )
        if not my_resp.json():
            raise HTTPException(status_code=404, detail="Create profile first")
        my_profile = my_resp.json()[0]
        
        all_resp = client.get(
            f"{settings.supabase_url}/rest/v1/user_data",
            params={"is_complete": "eq.true"},
            headers={"apikey": settings.supabase_key}
        )
        
        candidates = [c for c in all_resp.json() if c.get('user_id') != user_id]
        if not candidates:
            return []
        
        seeking = my_profile.get('seeking_gender', 'everyone')
        filtered = filter_by_gender(candidates, seeking)
        
        for c in filtered:
            my_int = interests_from_profile(my_profile)
            c_int = interests_from_profile(c)
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
            'interests': profile_data.get('interests'),
            'gender': profile_data.get('gender'),
            'Job': profile_data.get('job'),
            'sexual pref': profile_data.get('sexual_pref'),
            'pro-nouns': profile_data.get('pronouns'),
            'Zodiac': profile_data.get('zodiac'),
            'education': profile_data.get('education'),
            'relationship': profile_data.get('relationship_status'),
            'living': profile_data.get('living_status'),
            'seeking_gender': profile_data.get('seeking_gender', 'everyone'),
            'max_distance_km': profile_data.get('max_distance_km', 50),
            'is_complete': True,
            'user_id': user_id,
        }
        # Remove None values to avoid overwriting with nulls
        mapped = {k: v for k, v in mapped.items() if v is not None}
        
        existing = client.get(
            f"{settings.supabase_url}/rest/v1/user_data",
            params={"user_id": f"eq.{user_id}"},
            headers={"apikey": settings.supabase_key}
        )
        if existing.json():
            client.patch(
                f"{settings.supabase_url}/rest/v1/user_data",
                params={"user_id": f"eq.{user_id}"},
                json=mapped,
                headers={"apikey": settings.supabase_key, "Content-Type": "application/json"}
            )
            return {"status": "updated", "user_id": user_id}
        
        result = client.post(
            f"{settings.supabase_url}/rest/v1/user_data",
            json=mapped,
            headers={
                "apikey": settings.supabase_key,
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            }
        )
        if result.status_code >= 400:
            raise HTTPException(status_code=result.status_code, detail=result.text)
        data = result.json()
        return data[0] if isinstance(data, list) and data else {"status": "created", "user_id": user_id}


app.include_router(profiles_router, prefix="/api/v1")


# ---- Matches Routes (Supabase REST) ----
matches_router = APIRouter(prefix="/matches", tags=["Matches"])


def _get_user_id_and_token(authorization: str, settings):
    """Extract user_id and clean token from Bearer token via Supabase."""
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
        return resp.json().get("id"), token


def _create_or_update_match(settings, token: str, sender_id: str, receiver_id: str):
    if not receiver_id:
        raise HTTPException(status_code=400, detail="receiver_id required")
    if sender_id == receiver_id:
        raise HTTPException(status_code=400, detail="Cannot match with yourself")

    base_headers = {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {token}",
    }
    write_headers = {
        **base_headers,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    with httpx.Client() as client:
        my_profile_resp = client.get(
            f"{settings.supabase_url}/rest/v1/user_data",
            params={"user_id": f"eq.{sender_id}"},
            headers=base_headers,
        )
        my_profiles = my_profile_resp.json() if my_profile_resp.status_code < 400 else []
        my_profile = my_profiles[0] if my_profiles else {}

        receiver_profile_resp = client.get(
            f"{settings.supabase_url}/rest/v1/user_data",
            params={"user_id": f"eq.{receiver_id}"},
            headers=base_headers,
        )
        receiver_profiles = (
            receiver_profile_resp.json() if receiver_profile_resp.status_code < 400 else []
        )
        if not receiver_profiles:
            raise HTTPException(status_code=404, detail="Candidate not found")
        receiver_profile = receiver_profiles[0]

        compatibility_score = calculate_compatibility(
            interests_from_profile(my_profile),
            interests_from_profile(receiver_profile),
        )

        outgoing_resp = client.get(
            f"{settings.supabase_url}/rest/v1/matches",
            params={
                "sender_id": f"eq.{sender_id}",
                "receiver_id": f"eq.{receiver_id}",
                "order": "created_at.desc",
                "limit": 1,
            },
            headers=base_headers,
        )
        outgoing_rows = outgoing_resp.json() if outgoing_resp.status_code < 400 else []
        outgoing = outgoing_rows[0] if outgoing_rows else None

        if outgoing and outgoing.get("status") in {"accepted", "matched"}:
            return {
                **outgoing,
                "matched": True,
                "compatibility_score": outgoing.get("compatibility_score", compatibility_score),
            }

        if not outgoing:
            fallback_payload = {
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "status": "pending",
            }
            insert_payload = {
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "status": "pending",
                "compatibility_score": compatibility_score,
            }
            save_resp = client.post(
                f"{settings.supabase_url}/rest/v1/matches",
                json=insert_payload,
                headers=write_headers,
            )

            # Handle older schemas where compatibility_score may not exist.
            if save_resp.status_code >= 400:
                save_resp = client.post(
                    f"{settings.supabase_url}/rest/v1/matches",
                    json=fallback_payload,
                    headers=write_headers,
                )

            if save_resp.status_code >= 400:
                raise HTTPException(status_code=save_resp.status_code, detail=save_resp.text)

            saved_rows = save_resp.json()
            outgoing = saved_rows[0] if isinstance(saved_rows, list) and saved_rows else fallback_payload
        elif outgoing.get("status") == "rejected":
            reset_resp = client.patch(
                f"{settings.supabase_url}/rest/v1/matches",
                params={"id": f"eq.{outgoing.get('id')}"},
                json={"status": "pending"},
                headers={**base_headers, "Content-Type": "application/json"},
            )
            if reset_resp.status_code < 400:
                outgoing["status"] = "pending"

        reciprocal_resp = client.get(
            f"{settings.supabase_url}/rest/v1/matches",
            params={
                "sender_id": f"eq.{receiver_id}",
                "receiver_id": f"eq.{sender_id}",
                "order": "created_at.desc",
                "limit": 1,
            },
            headers=base_headers,
        )
        reciprocal_rows = reciprocal_resp.json() if reciprocal_resp.status_code < 400 else []
        reciprocal = reciprocal_rows[0] if reciprocal_rows else None

        matched = bool(reciprocal and reciprocal.get("status") != "rejected")
        if matched:
            patch_headers = {**base_headers, "Content-Type": "application/json"}
            client.patch(
                f"{settings.supabase_url}/rest/v1/matches",
                params={"sender_id": f"eq.{sender_id}", "receiver_id": f"eq.{receiver_id}"},
                json={"status": "accepted"},
                headers=patch_headers,
            )
            client.patch(
                f"{settings.supabase_url}/rest/v1/matches",
                params={"sender_id": f"eq.{receiver_id}", "receiver_id": f"eq.{sender_id}"},
                json={"status": "accepted"},
                headers=patch_headers,
            )
            outgoing["status"] = "accepted"

        outgoing["compatibility_score"] = outgoing.get("compatibility_score", compatibility_score)
        outgoing["matched"] = matched
        return outgoing


@matches_router.post("/")
def create_match(data: dict, authorization: str = Header(None)):
    settings = get_settings()
    receiver_id = data.get("receiver_id") or data.get("candidate_id")
    if not receiver_id:
        raise HTTPException(status_code=400, detail="receiver_id required")

    user_id, token = _get_user_id_and_token(authorization, settings)
    result = _create_or_update_match(
        settings=settings,
        token=token,
        sender_id=user_id,
        receiver_id=str(receiver_id),
    )
    return {
        "id": result.get("id"),
        "sender_id": result.get("sender_id", user_id),
        "receiver_id": result.get("receiver_id", str(receiver_id)),
        "status": result.get("status", "pending"),
        "matched": result.get("matched", False),
        "compatibility_score": result.get("compatibility_score"),
        "created_at": result.get("created_at"),
    }


@matches_router.get("/")
def get_my_matches(authorization: str = Header(None)):
    settings = get_settings()
    user_id, token = _get_user_id_and_token(authorization, settings)
    rls_headers = {"apikey": settings.supabase_key, "Authorization": f"Bearer {token}"}
    with httpx.Client() as client:
        sent = client.get(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"sender_id": f"eq.{user_id}", "order": "created_at.desc"},
            headers=rls_headers,
        ).json()
        received = client.get(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"receiver_id": f"eq.{user_id}", "order": "created_at.desc"},
            headers=rls_headers,
        ).json()
        return sent + received


@matches_router.patch("/{match_id}/accept")
def accept_match(match_id: int, authorization: str = Header(None)):
    settings = get_settings()
    user_id, token = _get_user_id_and_token(authorization, settings)
    rls_headers = {"apikey": settings.supabase_key, "Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    with httpx.Client() as client:
        match_resp = client.get(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"id": f"eq.{match_id}"},
            headers=rls_headers,
        )
        matches = match_resp.json()
        if not matches:
            raise HTTPException(status_code=404, detail="Match not found")
        match = matches[0]
        if match.get("receiver_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        client.patch(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"id": f"eq.{match_id}"},
            json={"status": "accepted"},
            headers=rls_headers,
        )
        match["status"] = "accepted"
        return match


@matches_router.patch("/{match_id}/reject")
def reject_match(match_id: int, authorization: str = Header(None)):
    settings = get_settings()
    user_id, token = _get_user_id_and_token(authorization, settings)
    rls_headers = {"apikey": settings.supabase_key, "Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    with httpx.Client() as client:
        match_resp = client.get(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"id": f"eq.{match_id}"},
            headers=rls_headers,
        )
        matches = match_resp.json()
        if not matches:
            raise HTTPException(status_code=404, detail="Match not found")
        match = matches[0]
        if match.get("receiver_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")
        client.patch(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"id": f"eq.{match_id}"},
            json={"status": "rejected"},
            headers=rls_headers,
        )
        return {"status": "rejected"}


app.include_router(matches_router, prefix="/api/v1")


# ---- Messages Routes (Supabase REST) ----
messages_router = APIRouter(prefix="/messages", tags=["Messages"])


@messages_router.post("/")
def send_message(data: dict, authorization: str = Header(None)):
    settings = get_settings()
    user_id, token = _get_user_id_and_token(authorization, settings)
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
                "Authorization": f"Bearer {token}",
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
    user_id, token = _get_user_id_and_token(authorization, settings)
    rls_headers = {"apikey": settings.supabase_key, "Authorization": f"Bearer {token}"}
    with httpx.Client() as client:
        sent = client.get(
            f"{settings.supabase_url}/rest/v1/messages",
            params={
                "sender_id": f"eq.{user_id}",
                "receiver_id": f"eq.{target_user_id}",
                "order": "created_at.asc",
            },
            headers=rls_headers,
        ).json()
        received = client.get(
            f"{settings.supabase_url}/rest/v1/messages",
            params={
                "sender_id": f"eq.{target_user_id}",
                "receiver_id": f"eq.{user_id}",
                "order": "created_at.asc",
            },
            headers=rls_headers,
        ).json()
        all_msgs = sent + received
        all_msgs.sort(key=lambda m: m.get("created_at", ""))
        return all_msgs


@messages_router.get("/conversations")
def get_all_conversations(authorization: str = Header(None)):
    settings = get_settings()
    user_id, token = _get_user_id_and_token(authorization, settings)
    rls_headers = {"apikey": settings.supabase_key, "Authorization": f"Bearer {token}"}
    with httpx.Client() as client:
        sent = client.get(
            f"{settings.supabase_url}/rest/v1/messages",
            params={"sender_id": f"eq.{user_id}", "order": "created_at.desc"},
            headers=rls_headers,
        ).json()
        received = client.get(
            f"{settings.supabase_url}/rest/v1/messages",
            params={"receiver_id": f"eq.{user_id}", "order": "created_at.desc"},
            headers=rls_headers,
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


# ---- AI Routes (OpenRouter + fallback) ----
ai_router = APIRouter(prefix="/ai", tags=["AI"])


def _normalize_interests(raw_value):
    if not raw_value:
        return []
    if isinstance(raw_value, list):
        values = raw_value
    else:
        values = str(raw_value).split(",")
    return [str(v).strip() for v in values if str(v).strip()]


def _fallback_icebreaker(my_interests, target_interests):
    my_set = {i.lower() for i in _normalize_interests(my_interests)}
    target_set = {i.lower() for i in _normalize_interests(target_interests)}
    shared = sorted(my_set & target_set)
    if shared:
        topic = shared[0].capitalize()
        return f"I noticed we both like {topic}. What got you into it?"
    return "Hey, glad we matched. What does your ideal weekend look like?"


def _generate_ai_icebreaker(settings, my_interests, target_interests):
    if not settings.openrouter_api_key:
        return None

    prompt = (
        "Write one short dating-app icebreaker under 30 words. "
        "Keep it friendly, specific, and natural. "
        f"Person A interests: {my_interests or 'general topics'}. "
        f"Person B interests: {target_interests or 'general topics'}."
    )

    try:
        with httpx.Client() as client:
            resp = client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json={
                    "model": "tencent/hy3-preview:free",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a concise assistant that writes one-line icebreakers.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 80,
                },
                headers={
                    "Authorization": f"Bearer {settings.openrouter_api_key}",
                    "Content-Type": "application/json",
                },
                timeout=20,
            )
            if resp.status_code >= 400:
                return None
            content = (
                resp.json()
                .get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
                .strip()
            )
            return content or None
    except Exception:
        return None


@ai_router.get("/icebreaker/{target_user_id}")
def get_icebreaker(target_user_id: str, authorization: str = Header(None)):
    settings = get_settings()
    user_id, token = _get_user_id_and_token(authorization, settings)
    headers = {"apikey": settings.supabase_key, "Authorization": f"Bearer {token}"}

    with httpx.Client() as client:
        my_profile_resp = client.get(
            f"{settings.supabase_url}/rest/v1/user_data",
            params={"user_id": f"eq.{user_id}"},
            headers=headers,
        )
        my_profiles = my_profile_resp.json() if my_profile_resp.status_code < 400 else []
        if not my_profiles:
            raise HTTPException(status_code=400, detail="Create your profile first")

        target_profile_resp = client.get(
            f"{settings.supabase_url}/rest/v1/user_data",
            params={"user_id": f"eq.{target_user_id}"},
            headers=headers,
        )
        target_profiles = (
            target_profile_resp.json() if target_profile_resp.status_code < 400 else []
        )
        if not target_profiles:
            raise HTTPException(status_code=404, detail="Target profile not found")

        sent_match = client.get(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"sender_id": f"eq.{user_id}", "receiver_id": f"eq.{target_user_id}"},
            headers=headers,
        ).json()
        received_match = client.get(
            f"{settings.supabase_url}/rest/v1/matches",
            params={"sender_id": f"eq.{target_user_id}", "receiver_id": f"eq.{user_id}"},
            headers=headers,
        ).json()
        if not (sent_match or received_match):
            raise HTTPException(status_code=403, detail="Users must match before requesting an icebreaker")

        my_interests = interests_from_profile(my_profiles[0])
        target_interests = interests_from_profile(target_profiles[0])
        ai_text = _generate_ai_icebreaker(settings, my_interests, target_interests)
        return {"icebreaker": ai_text or _fallback_icebreaker(my_interests, target_interests)}


@ai_router.get("/compatibility/{target_user_id}")
def get_compatibility(target_user_id: str, authorization: str = Header(None)):
    settings = get_settings()
    user_id, token = _get_user_id_and_token(authorization, settings)
    headers = {"apikey": settings.supabase_key, "Authorization": f"Bearer {token}"}

    with httpx.Client() as client:
        my_profile_resp = client.get(
            f"{settings.supabase_url}/rest/v1/user_data",
            params={"user_id": f"eq.{user_id}"},
            headers=headers,
        )
        my_profiles = my_profile_resp.json() if my_profile_resp.status_code < 400 else []
        if not my_profiles:
            raise HTTPException(status_code=400, detail="Create your profile first")

        target_profile_resp = client.get(
            f"{settings.supabase_url}/rest/v1/user_data",
            params={"user_id": f"eq.{target_user_id}"},
            headers=headers,
        )
        target_profiles = (
            target_profile_resp.json() if target_profile_resp.status_code < 400 else []
        )
        if not target_profiles:
            raise HTTPException(status_code=404, detail="Target profile not found")

        score = calculate_compatibility(
            interests_from_profile(my_profiles[0]),
            interests_from_profile(target_profiles[0]),
        )
        return {"profile_id": target_user_id, "compatibility_score": score}


app.include_router(ai_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "BLOWTORCH API", "docs": "/docs"}

@app.get("/demo", response_class=HTMLResponse)
def get_demo():
    file_path = os.path.join(os.path.dirname(__file__), "demo.html")
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

@app.get("/health")
def health():
    return {"status": "healthy"}