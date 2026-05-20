from fastapi import FastAPI, APIRouter, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from concurrent.futures import ThreadPoolExecutor
import httpx
from typing import Optional, Any, cast, Dict
import math
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from .config import get_settings
from .compatibility import get_llm_compatibility_score

PROFILE_TABLE = "user_data"

limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])
app = FastAPI(title="BLOWTORCH", version="0.1.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore
app.add_middleware(SlowAPIMiddleware)

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
    return httpx.Client(
        base_url=settings.supabase_url, headers={"apikey": settings.supabase_key}
    )


def supabase_headers(settings, token: Optional[str] = None, content_type: bool = False):
    headers = {"apikey": settings.supabase_key}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if content_type:
        headers["Content-Type"] = "application/json"
    return headers


def _compact_dict(data: dict) -> dict:
    return {k: v for k, v in data.items() if v is not None}


def _coerce_float(value):
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _coerce_int(value):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _coerce_bool(value):
    if value in (None, ""):
        return None
    if isinstance(value, bool):
        return value
    normalized = str(value).strip().lower()
    if normalized in {"true", "yes", "1", "on"}:
        return True
    if normalized in {"false", "no", "0", "off"}:
        return False
    return None


def _text_value(value):
    if value in (None, ""):
        return None
    return str(value).strip()


_ENUM_VALUE_OVERRIDES = {
    "books_reading": "books reading",
    "he_him": "he him",
    "non_binary": "non binary",
    "she_her": "she her",
    "swimming": "swmiming",
    "they_them": "they them",
}

_DAY_VALUE_OVERRIDES = {
    "monday": "mon",
    "mon": "mon",
    "tuesday": "tue",
    "tue": "tue",
    "wednesday": "wed",
    "wed": "wed",
    "thursday": "thur",
    "thu": "thur",
    "thur": "thur",
    "friday": "fri",
    "fri": "fri",
    "saturday": "sat",
    "sat": "sat",
    "sunday": "sun",
    "sun": "sun",
}

_TIME_VALUE_OVERRIDES = {
    "1-3am": "1-3am",
    "3-5am": "3-5am",
    "5-7am": "5-7am",
    "7-9am": "7-9am",
    "9-11am": "9-11am",
    "11am-1pm": "11am-1pm",
    "1-3pm": "1-3pm",
    "3-5pm": "3-5pm",
    "5-7pm": "5-7pm",
    "7-9pm": "7-9pm",
    "9-11pm": "9-11pm",
    "11pm-1am": "11pm-1am",
}


def _enum_value(value):
    if value in (None, ""):
        return None
    normalized = (
        str(value).strip().lower().replace("/", "_").replace("-", "_").replace(" ", "_")
    )
    return _ENUM_VALUE_OVERRIDES.get(normalized, normalized)


def _array_values(value):
    if value in (None, ""):
        return []
    if isinstance(value, list):
        return value
    return str(value).split(",")


def _text_array(value):
    values = [str(v).strip() for v in _array_values(value)]
    return [v for v in values if v]


def _enum_array(value):
    normalized = [_enum_value(v) for v in _array_values(value)]
    return [v for v in normalized if v]


def _schedule_value(value, overrides):
    if value in (None, ""):
        return None
    normalized = (
        str(value)
        .strip()
        .lower()
        .replace(" ", "")
        .replace("_", "-")
        .replace("/", "-")
        .replace("–", "-")
        .replace("—", "-")
    )
    return overrides.get(normalized)


def _schedule_array(value, overrides):
    normalized = [_schedule_value(v, overrides) for v in _array_values(value)]
    values = [v for v in normalized if v]
    return values or None


def _first_profile_value(profile_data: dict, *keys: str):
    for key in keys:
        if key in profile_data and profile_data.get(key) not in (None, ""):
            return profile_data.get(key)
    return None


def _availability_array(profile_data: dict):
    return _schedule_array(
        _first_profile_value(
            profile_data,
            "availability",
            "day_availability",
            "day availability",
            "day avalibility",
        ),
        _DAY_VALUE_OVERRIDES,
    )


def _time_availability_array(profile_data: dict):
    return _schedule_array(
        _first_profile_value(
            profile_data,
            "time_availability",
            "timeAvailability",
            "time availability",
            "time avalibility",
        ),
        _TIME_VALUE_OVERRIDES,
    )


def normalize_profile_row(row: dict) -> dict:
    """Keep current frontend aliases while using the live database schema."""
    if not isinstance(row, dict):
        return row
    normalized = dict(row)
    alias_pairs = {
        "Name": "name",
        "Age": "age",
        "Location": "location",
        "Job": "job",
        "Zodiac": "zodiac",
        "display_name": "name",
        "relationship_status": "relationship",
        "living_status": "living",
    }
    for alias, source in alias_pairs.items():
        if alias not in normalized and source in normalized:
            normalized[alias] = normalized[source]
    return normalized


def normalize_profile_rows(rows):
    if not isinstance(rows, list):
        return rows
    return [normalize_profile_row(row) for row in rows]


def _profile_display_summary(row: dict | None) -> dict | None:
    if not row:
        return None
    normalized = normalize_profile_row(row)
    return _compact_dict(
        {
            "user_id": normalized.get("user_id"),
            "name": normalized.get("name") or normalized.get("Name"),
            "Name": normalized.get("Name") or normalized.get("name"),
            "age": normalized.get("age") or normalized.get("Age"),
            "gender": normalized.get("gender"),
            "interests": normalized.get("interests"),
            "profile_image_url": normalized.get("profile_image_url"),
        }
    )


def _profile_lookup_for_user_ids(client, settings, token: str, user_ids: set[str]):
    if not user_ids:
        return {}
    ids = ",".join(sorted(uid for uid in user_ids if uid))
    if not ids:
        return {}

    resp = client.get(
        f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
        params={
            "user_id": f"in.({ids})",
            "select": "user_id,name,age,gender,interests",
        },
        headers=supabase_headers(settings, token),
    )
    if resp.status_code >= 400:
        return {}
    rows = resp.json()
    return {
        str(row.get("user_id")): _profile_display_summary(row)
        for row in rows
        if row.get("user_id")
    }


def _enrich_matches_with_profiles(
    matches: list[dict], profiles_by_user_id: dict, me_id: str
):
    enriched = []
    for match in matches:
        row = dict(match)
        sender_id = str(row.get("sender_id") or "")
        receiver_id = str(row.get("receiver_id") or "")
        other_id = receiver_id if sender_id == str(me_id) else sender_id
        row["sender_profile"] = profiles_by_user_id.get(sender_id)
        row["receiver_profile"] = profiles_by_user_id.get(receiver_id)
        row["other_user_id"] = other_id
        row["other_profile"] = profiles_by_user_id.get(other_id)
        enriched.append(row)
    return enriched


def build_profile_rpc_payload(profile_data: dict, user_id: str) -> dict:
    interests = profile_data.get("interests")
    pronouns = profile_data.get("pronouns")
    payload = {
        "p_user_id": user_id,
        "p_name": profile_data.get("display_name") or profile_data.get("name"),
        "p_age": _coerce_int(profile_data.get("age")),
        "p_location": _coerce_float(profile_data.get("location")),
        "p_interests": _enum_array(interests),
        "p_availability": _availability_array(profile_data),
        "p_gender": _enum_value(profile_data.get("gender")),
        "p_job": _enum_value(profile_data.get("job")),
        "p_sexual_pref": _enum_value(profile_data.get("sexual_pref")),
        "p_pronouns": _enum_value(pronouns),
        "p_zodiac": _enum_value(profile_data.get("zodiac")),
        "p_education": _enum_value(profile_data.get("education")),
        "p_relationship": _enum_value(
            profile_data.get("relationship_status") or profile_data.get("relationship")
        ),
        "p_living": _enum_value(
            profile_data.get("living_status") or profile_data.get("living")
        ),
        "p_seeking_gender": profile_data.get("seeking_gender", "everyone"),
        "p_max_distance_km": _coerce_int(profile_data.get("max_distance_km")) or 50,
    }
    return _compact_dict(payload)


def build_profile_extra_patch_payload(profile_data: dict) -> dict:
    """Fields outside the historical create_user_profile RPC contract."""
    payload = {
        "bio": _text_value(profile_data.get("bio")),
        "height": _coerce_float(profile_data.get("height")),
        "weight": _coerce_float(profile_data.get("weight")),
        "kids": _coerce_bool(profile_data.get("kids")),
        "pets": _coerce_bool(profile_data.get("pets")),
        "drives": _coerce_bool(profile_data.get("drives")),
        "mbti": _enum_value(
            profile_data.get("mbti") or profile_data.get("personality_type")
        ),
        "languages": _text_array(profile_data.get("languages")),
        "socials": _text_array(profile_data.get("socials")),
        "body_modification": _text_array(profile_data.get("body_modification")),
        "availability": _availability_array(profile_data) or [],
        "time_availability": _time_availability_array(profile_data) or [],
    }
    return {k: v for k, v in payload.items() if v is not None}


def build_profile_rest_payload(profile_data: dict, user_id: str) -> dict:
    """Direct table payload for local/mocked clients; production uses create_user_profile RPC."""
    payload = {
        "user_id": user_id,
        "name": profile_data.get("display_name") or profile_data.get("name"),
        "age": _coerce_int(profile_data.get("age")),
        "location": _coerce_float(profile_data.get("location")),
        "bio": _text_value(profile_data.get("bio")),
        "height": _coerce_float(profile_data.get("height")),
        "weight": _coerce_float(profile_data.get("weight")),
        "interests": _enum_array(profile_data.get("interests")),
        "availability": _availability_array(profile_data),
        "time_availability": _time_availability_array(profile_data),
        "gender": _enum_value(profile_data.get("gender")),
        "job": _enum_value(profile_data.get("job")),
        "sexual_pref": _enum_value(profile_data.get("sexual_pref")),
        "pronouns": _enum_value(profile_data.get("pronouns")),
        "zodiac": _enum_value(profile_data.get("zodiac")),
        "education": _enum_value(profile_data.get("education")),
        "relationship": _enum_value(
            profile_data.get("relationship_status") or profile_data.get("relationship")
        ),
        "living": _enum_value(
            profile_data.get("living_status") or profile_data.get("living")
        ),
        "kids": _coerce_bool(profile_data.get("kids")),
        "pets": _coerce_bool(profile_data.get("pets")),
        "drives": _coerce_bool(profile_data.get("drives")),
        "mbti": _enum_value(
            profile_data.get("mbti") or profile_data.get("personality_type")
        ),
        "languages": _text_array(profile_data.get("languages")),
        "socials": _text_array(profile_data.get("socials")),
        "body_modification": _text_array(profile_data.get("body_modification")),
        "seeking_gender": profile_data.get("seeking_gender", "everyone"),
        "max_distance_km": _coerce_int(profile_data.get("max_distance_km")) or 50,
        "is_complete": True,
    }
    return _compact_dict(payload)


def get_database_compatibility_score(
    settings, token: str, user1_id: str, user2_id: str
):
    if not user1_id or not user2_id:
        return None
    if (
        ".supabase.co" not in settings.supabase_url
        or "fake" in settings.supabase_url
        or settings.supabase_key == "fake-key"
    ):
        return None
    try:
        with httpx.Client() as client:
            resp = client.post(
                f"{settings.supabase_url}/rest/v1/rpc/compatibility_score",
                json={"user1_id": user1_id, "user2_id": user2_id},
                headers=supabase_headers(settings, token, content_type=True),
            )
            if resp.status_code >= 400:
                return None
            value = resp.json()
            return float(value)
    except Exception:
        return None


def get_match_compatibility_score(
    settings,
    token: str,
    user1_id: str,
    user2_id: str,
    profile_a: dict | None = None,
    profile_b: dict | None = None,
) -> float:
    if profile_a and profile_b:
        llm_score = get_llm_compatibility_score(
            getattr(settings, "openrouter_api_key", ""), profile_a, profile_b
        )
        if llm_score is not None:
            return float(llm_score)

    score = get_database_compatibility_score(settings, token, user1_id, user2_id)
    return float(score) if score is not None else 0.0


def response_failed(resp) -> bool:
    status_code = getattr(resp, "status_code", None)
    return isinstance(status_code, int) and status_code >= 400


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
        response = client.get(
            "/auth/v1/user", headers={"Authorization": f"Bearer {token}"}
        )
        if response.status_code >= 400:
            raise HTTPException(status_code=401, detail="Invalid token")
        return response.json()


@auth_router.get("/google/url")
def get_google_oauth_url(request: Request):
    settings = get_settings()
    # Get the origin or referer to know where to redirect back to
    origin = request.headers.get("origin")
    referer = request.headers.get("referer")

    redirect_to = (
        origin if origin else (referer if referer else "http://localhost:5173")
    )
    if redirect_to.endswith("/"):
        redirect_to = redirect_to[:-1]

    url = f"{settings.supabase_url}/auth/v1/authorize?provider=google&redirect_to={redirect_to}"
    return {"url": url}


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
            headers={
                "apikey": settings.supabase_key,
                "Authorization": f"Bearer {token}",
            },
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
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


def filter_by_gender(profiles, seeking):
    if not seeking or seeking == "everyone":
        return profiles
    if seeking == "both":
        return [
            p
            for p in profiles
            if str(p.get("gender") or "").lower() in {"male", "female"}
        ]
    return [
        p
        for p in profiles
        if str(p.get("gender") or "").lower() == str(seeking).lower()
    ]


@profiles_router.get("/me")
def get_my_profile(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization.replace("Bearer ", "")
    settings = get_settings()

    with httpx.Client() as client:
        user_resp = client.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={
                "apikey": settings.supabase_key,
                "Authorization": f"Bearer {token}",
            },
        )
        if user_resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid token")
        user_id = user_resp.json().get("id")

        resp = client.get(
            f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
            params={"user_id": f"eq.{user_id}"},
            headers=supabase_headers(settings, token),
        )
        profiles = resp.json()
        if profiles:
            return normalize_profile_row(profiles[0])
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
            headers={
                "apikey": settings.supabase_key,
                "Authorization": f"Bearer {token}",
            },
        )
        user_id = me_resp.json().get("id")

        my_resp = client.get(
            f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
            params={"user_id": f"eq.{user_id}"},
            headers=supabase_headers(settings, token),
        )
        if not my_resp.json():
            raise HTTPException(status_code=404, detail="Create profile first")
        my_profile = my_resp.json()[0]

        all_resp = client.get(
            f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
            params={"is_complete": "eq.true"},
            headers=supabase_headers(settings, token),
        )

        candidates = [c for c in all_resp.json() if c.get("user_id") != user_id]
        if not candidates:
            return []

        seeking = my_profile.get("seeking_gender", "everyone")
        filtered = filter_by_gender(candidates, seeking)

        candidate_pool = filtered[: min(len(filtered), max(limit, 1) * 2, 25)]

        def score_candidate(candidate):
            candidate["compatibility_score"] = get_match_compatibility_score(
                settings,
                token,
                user_id,
                candidate.get("user_id"),
                my_profile,
                candidate,
            )
            return candidate

        if candidate_pool:
            max_workers = min(10, len(candidate_pool))
            with ThreadPoolExecutor(max_workers=max_workers) as executor:
                filtered = list(executor.map(score_candidate, candidate_pool))

        filtered.sort(key=lambda x: x.get("compatibility_score", 0), reverse=True)
        return normalize_profile_rows(filtered[:limit])


@profiles_router.get("/{profile_user_id}")
def get_profile_by_user_id(profile_user_id: str, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization.replace("Bearer ", "")
    settings = get_settings()

    with httpx.Client() as client:
        resp = client.get(
            f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
            params={"user_id": f"eq.{profile_user_id}"},
            headers=supabase_headers(settings, token),
        )
        rows = resp.json() if resp.status_code < 400 else []
        if not rows:
            raise HTTPException(status_code=404, detail="Profile not found")
        return normalize_profile_row(rows[0])


@profiles_router.post("/")
def create_profile(profile_data: dict, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization")
    token = authorization.replace("Bearer ", "")
    settings = get_settings()

    with httpx.Client() as client:
        me_resp = client.get(
            f"{settings.supabase_url}/auth/v1/user",
            headers={
                "apikey": settings.supabase_key,
                "Authorization": f"Bearer {token}",
            },
        )
        user_id = me_resp.json().get("id")

        existing = client.get(
            f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
            params={"user_id": f"eq.{user_id}"},
            headers=supabase_headers(settings, token),
        )
        existed = bool(existing.json())

        if ".supabase.co" in settings.supabase_url:
            result = client.post(
                f"{settings.supabase_url}/rest/v1/rpc/create_user_profile",
                json=build_profile_rpc_payload(profile_data, user_id),
                headers=supabase_headers(settings, token, content_type=True),
            )
            if not response_failed(result):
                patch_payload: dict[str, Any] = {
                    **build_profile_extra_patch_payload(profile_data),
                    "is_complete": True,
                }
                client.patch(
                    f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
                    params={"user_id": f"eq.{user_id}"},
                    json=patch_payload,
                    headers=supabase_headers(settings, token, content_type=True),
                )
        elif existed:
            result = client.patch(
                f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
                params={"user_id": f"eq.{user_id}"},
                json=build_profile_rest_payload(profile_data, user_id),
                headers=supabase_headers(settings, token, content_type=True),
            )
        else:
            result = client.post(
                f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
                json=build_profile_rest_payload(profile_data, user_id),
                headers={
                    **supabase_headers(settings, token, content_type=True),
                    "Prefer": "return=representation",
                },
            )

        if response_failed(result):
            raise HTTPException(status_code=result.status_code, detail=result.text)

        try:
            refreshed = client.get(
                f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
                params={"user_id": f"eq.{user_id}"},
                headers=supabase_headers(settings, token),
            )
            rows = refreshed.json() if not response_failed(refreshed) else []
        except Exception:
            rows = []
        if rows:
            row = normalize_profile_row(rows[0])
            row["status"] = "updated" if existed else "created"
            return row
        data = result.json()
        if isinstance(data, list) and data:
            row = normalize_profile_row(data[0])
            row["status"] = "updated" if existed else "created"
            return row
        return {"status": "updated" if existed else "created", "user_id": user_id}


@profiles_router.patch("/me")
def update_my_profile(profile_data: dict, authorization: str = Header(None)):
    return create_profile(profile_data, authorization)


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
            headers={
                "apikey": settings.supabase_key,
                "Authorization": f"Bearer {token}",
            },
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
            f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
            params={"user_id": f"eq.{sender_id}"},
            headers=base_headers,
        )
        my_profiles = (
            my_profile_resp.json() if my_profile_resp.status_code < 400 else []
        )
        my_profile = my_profiles[0] if my_profiles else {}

        receiver_profile_resp = client.get(
            f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
            params={"user_id": f"eq.{receiver_id}"},
            headers=base_headers,
        )
        receiver_profiles = (
            receiver_profile_resp.json()
            if receiver_profile_resp.status_code < 400
            else []
        )
        if not receiver_profiles:
            raise HTTPException(status_code=404, detail="Candidate not found")
        receiver_profile = receiver_profiles[0]

        compatibility_score = get_match_compatibility_score(
            settings,
            token,
            sender_id,
            receiver_id,
            my_profile,
            receiver_profile,
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
        outgoing = cast(Dict[str, Any], outgoing_rows[0]) if outgoing_rows else None

        if outgoing and outgoing.get("status") in {"accepted", "matched"}:
            return {
                **outgoing,
                "matched": True,
                "compatibility_score": outgoing.get(
                    "compatibility_score", compatibility_score
                ),
            }

        if not outgoing:
            fallback_payload: Dict[str, Any] = {
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
                raise HTTPException(
                    status_code=save_resp.status_code, detail=save_resp.text
                )

            saved_rows = save_resp.json()
            outgoing = (
                saved_rows[0]
                if isinstance(saved_rows, list) and saved_rows
                else fallback_payload
            )
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
        reciprocal_rows = (
            reciprocal_resp.json() if reciprocal_resp.status_code < 400 else []
        )
        reciprocal = reciprocal_rows[0] if reciprocal_rows else None

        matched = bool(reciprocal and reciprocal.get("status") != "rejected")
        if matched:
            patch_headers = {**base_headers, "Content-Type": "application/json"}
            client.patch(
                f"{settings.supabase_url}/rest/v1/matches",
                params={
                    "sender_id": f"eq.{sender_id}",
                    "receiver_id": f"eq.{receiver_id}",
                },
                json={"status": "accepted"},
                headers=patch_headers,
            )
            client.patch(
                f"{settings.supabase_url}/rest/v1/matches",
                params={
                    "sender_id": f"eq.{receiver_id}",
                    "receiver_id": f"eq.{sender_id}",
                },
                json={"status": "accepted"},
                headers=patch_headers,
            )
            outgoing["status"] = "accepted"

        outgoing["compatibility_score"] = outgoing.get(
            "compatibility_score", compatibility_score
        )
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
        matches = sent + received
        profile_ids = {
            str(value)
            for match in matches
            for value in (match.get("sender_id"), match.get("receiver_id"))
            if value
        }
        profiles = _profile_lookup_for_user_ids(client, settings, token, profile_ids)
        return _enrich_matches_with_profiles(matches, profiles, user_id)


@matches_router.patch("/{match_id}/accept")
def accept_match(match_id: int, authorization: str = Header(None)):
    settings = get_settings()
    user_id, token = _get_user_id_and_token(authorization, settings)
    rls_headers = {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
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
    rls_headers = {
        "apikey": settings.supabase_key,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
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
            },
        )
        if resp.status_code >= 400:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        messages = resp.json()
        return (
            messages[0]
            if messages
            else {"sender_id": user_id, "receiver_id": receiver_id, "content": content}
        )


@messages_router.patch("/{message_id}/read")
def mark_message_read(message_id: int, authorization: str = Header(None)):
    settings = get_settings()
    user_id, token = _get_user_id_and_token(authorization, settings)
    rls_headers = {"apikey": settings.supabase_key, "Authorization": f"Bearer {token}"}

    with httpx.Client() as client:
        message_resp = client.get(
            f"{settings.supabase_url}/rest/v1/messages",
            params={"id": f"eq.{message_id}", "limit": 1},
            headers=rls_headers,
        )
        if message_resp.status_code >= 400:
            raise HTTPException(
                status_code=message_resp.status_code, detail=message_resp.text
            )
        messages = message_resp.json()
        if not messages:
            raise HTTPException(status_code=404, detail="Message not found")

        message = messages[0]
        if message.get("receiver_id") != user_id:
            raise HTTPException(status_code=403, detail="Not authorized")

        patch_resp = client.patch(
            f"{settings.supabase_url}/rest/v1/messages",
            params={"id": f"eq.{message_id}"},
            json={"is_read": True},
            headers={
                **rls_headers,
                "Content-Type": "application/json",
                "Prefer": "return=representation",
            },
        )
        if patch_resp.status_code >= 400:
            raise HTTPException(
                status_code=patch_resp.status_code, detail=patch_resp.text
            )

        updated = patch_resp.json()
        if isinstance(updated, list) and updated:
            return updated[0]
        message["is_read"] = True
        return message


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
            msgs = [
                m
                for m in all_msgs
                if m.get("sender_id") == uid or m.get("receiver_id") == uid
            ]
            msgs.sort(key=lambda m: m.get("created_at", ""), reverse=True)
            last = msgs[0] if msgs else None
            unread = sum(
                1
                for m in received
                if m.get("sender_id") == uid and not m.get("is_read")
            )
            conversations.append(
                {
                    "user_id": uid,
                    "last_message": last.get("content") if last else None,
                    "last_timestamp": last.get("created_at") if last else None,
                    "unread_count": unread,
                }
            )
        return conversations


app.include_router(messages_router, prefix="/api/v1")


# ---- AI Routes (OpenRouter + fallback) ----
ai_router = APIRouter(prefix="/ai", tags=["AI"])

DEFAULT_ICEBREAKER_MODELS = [
    "liquid/lfm-2.5-1.2b-instruct:free",
]


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


def _post_icebreaker_request(settings, client, model_id: str, prompt: str):
    try:
        return client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json={
                "model": model_id,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a concise assistant that writes one-line icebreakers.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 80,
                "temperature": 0.7,
            },
            headers={
                "Authorization": f"Bearer {settings.openrouter_api_key}",
                "Content-Type": "application/json",
            },
            timeout=20,
        )
    except Exception:
        return None


def _icebreaker_from_response(resp):
    if resp is None or resp.status_code >= 400:
        return None
    try:
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


def _generate_ai_icebreaker(settings, my_interests, target_interests):
    if not settings.openrouter_api_key:
        return None

    prompt = (
        "Write one short dating-app icebreaker under 30 words. "
        "Keep it friendly, specific, and natural. "
        f"Person A interests: {my_interests or 'general topics'}. "
        f"Person B interests: {target_interests or 'general topics'}."
    )

    with httpx.Client() as client:
        for model_id in DEFAULT_ICEBREAKER_MODELS:
            resp = _post_icebreaker_request(settings, client, model_id, prompt)
            content = _icebreaker_from_response(resp)
            if content:
                return content
    return None


@ai_router.get("/icebreaker/{target_user_id}")
def get_icebreaker(target_user_id: str, authorization: str = Header(None)):
    settings = get_settings()
    user_id, token = _get_user_id_and_token(authorization, settings)
    headers = supabase_headers(settings, token)

    with httpx.Client() as client:
        my_profile_resp = client.get(  # noqa: F841
            f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
            params={"user_id": f"eq.{user_id}"},
            headers=headers,
        )
        my_profiles = (  # noqa: F841
            my_profile_resp.json() if my_profile_resp.status_code < 400 else []
        )
        if not my_profiles:
            raise HTTPException(status_code=400, detail="Create your profile first")

        target_profile_resp = client.get(
            f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
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
            params={
                "sender_id": f"eq.{user_id}",
                "receiver_id": f"eq.{target_user_id}",
            },
            headers=headers,
        ).json()
        received_match = client.get(
            f"{settings.supabase_url}/rest/v1/matches",
            params={
                "sender_id": f"eq.{target_user_id}",
                "receiver_id": f"eq.{user_id}",
            },
            headers=headers,
        ).json()
        if not (sent_match or received_match):
            raise HTTPException(
                status_code=403,
                detail="Users must match before requesting an icebreaker",
            )

        my_interests = my_profiles[0].get("interests", "")
        target_interests = target_profiles[0].get("interests", "")
        ai_text = _generate_ai_icebreaker(settings, my_interests, target_interests)
        return {
            "icebreaker": ai_text
            or _fallback_icebreaker(my_interests, target_interests)
        }


@ai_router.get("/compatibility/{target_user_id}")
def get_compatibility(target_user_id: str, authorization: str = Header(None)):
    settings = get_settings()
    user_id, token = _get_user_id_and_token(authorization, settings)
    headers = supabase_headers(settings, token)

    with httpx.Client() as client:
        my_profile_resp = client.get(  # noqa: F841
            f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
            params={"user_id": f"eq.{user_id}"},
            headers=headers,
        )
        my_profiles = (  # noqa: F841
            my_profile_resp.json() if my_profile_resp.status_code < 400 else []
        )
        if not my_profiles:
            raise HTTPException(status_code=400, detail="Create your profile first")

        target_profile_resp = client.get(
            f"{settings.supabase_url}/rest/v1/{PROFILE_TABLE}",
            params={"user_id": f"eq.{target_user_id}"},
            headers=headers,
        )
        target_profiles = (
            target_profile_resp.json() if target_profile_resp.status_code < 400 else []
        )
        if not target_profiles:
            raise HTTPException(status_code=404, detail="Target profile not found")

        score = get_match_compatibility_score(
            settings,
            token,
            user_id,
            target_user_id,
            my_profiles[0],
            target_profiles[0],
        )
        return {"profile_id": target_user_id, "compatibility_score": score}


app.include_router(ai_router, prefix="/api/v1")


@app.get("/")
def root():
    return {"message": "BLOWTORCH API", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
