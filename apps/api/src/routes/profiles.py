from fastapi import APIRouter, HTTPException, status
import math
import httpx

router = APIRouter(prefix="/profiles", tags=["Profiles"])


def get_settings():
    from ..config import get_settings

    return get_settings()


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance in km"""
    R = 6371
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    return R * 2 * math.asin(math.sqrt(a))


def filter_by_location(profiles, user_lat, user_lon, max_km):
    """Filter by distance"""
    if not user_lat or not user_lon:
        return profiles
    filtered = []
    for p in profiles:
        if p.get("Location"):
            dist = haversine_distance(
                user_lat, user_lon, p["Location"], 0
            )  # simplified
            if dist <= max_km:
                p["distance_km"] = round(dist, 1)
                filtered.append(p)
        else:
            filtered.append(p)
    return filtered


def filter_by_gender(profiles, seeking):
    """Filter by gender preference"""
    if not seeking or seeking == "everyone":
        return profiles
    if seeking == "both":
        return [p for p in profiles if p.get("gender") in ["male", "female"]]
    return [p for p in profiles if p.get("gender", "").lower() == seeking.lower()]


def rank_with_ai(user_profile, candidates):
    """Rank by AI compatibility (MBTI + interests) - LAST STEP"""
    from ..services.recommendation_service import recommendation_service

    scored = []
    for c in candidates:
        # Get interests - check multiple possible field names
        user_interests = [
            user_profile.get("interest_1", ""),
            user_profile.get("interest_2", ""),
            user_profile.get("interest_3", ""),
        ]
        cand_interests = [
            c.get("interest_1", ""),
            c.get("interest_2", ""),
            c.get("interest_3", ""),
        ]

        user_interests_str = ",".join([i for i in user_interests if i])
        cand_interests_str = ",".join([i for i in cand_interests if i])

        score = recommendation_service.calculate_compatibility_score(
            user_interests=user_interests_str,
            user_personality=user_profile.get("MBTI", ""),
            candidate_interests=cand_interests_str,
            candidate_personality=cand_interests_str,  # MBTI field mapping needed
        )
        c["compatibility_score"] = round(score * 100, 1)
        scored.append(c)

    scored.sort(key=lambda x: x["compatibility_score"], reverse=True)
    return scored


@router.post("/")
def create_profile(profile_data: dict):
    """Create/update profile in UserData table"""
    settings = get_settings()

    # Map fields to UserData schema
    mapped = {
        "Name": profile_data.get("display_name"),
        "Age": profile_data.get("age"),
        "Location": profile_data.get("location"),
        "interest_1": profile_data.get("interest_1"),
        "interest_2": profile_data.get("interest_2"),
        "interest_3": profile_data.get("interest_3"),
        "Job": profile_data.get("job"),
        "gender": profile_data.get("gender"),
        "seeking_gender": profile_data.get("seeking_gender", "everyone"),
        "latitude": profile_data.get("latitude"),
        "longitude": profile_data.get("longitude"),
        "max_distance_km": profile_data.get("max_distance_km", 50),
        "is_complete": True,  # Mark complete when created
    }

    try:
        with httpx.Client() as client:
            # Get existing by user_id if provided
            user_id = profile_data.get("user_id")
            if user_id:
                existing = client.get(
                    f"{settings.supabase_url}/rest/v1/UserData",
                    params={"user_id": f"eq.{user_id}"},
                    headers={"apikey": settings.supabase_key},
                )
                if existing.json():
                    # Update
                    client.patch(
                        f"{settings.supabase_url}/rest/v1/UserData?user_id=eq.{user_id}",
                        json=mapped,
                        headers={
                            "apikey": settings.supabase_key,
                            "Content-Type": "application/json",
                        },
                    )
                    return {"status": "updated", "user_id": user_id}

            # Insert new
            result = client.post(
                f"{settings.supabase_url}/rest/v1/UserData",
                json=mapped,
                headers={
                    "apikey": settings.supabase_key,
                    "Content-Type": "application/json",
                },
            )
            return result.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/me")
def get_my_profile(auth_header: str = None):
    """Get current user's profile"""
    settings = get_settings()

    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing authorization")

    token = auth_header.replace("Bearer ", "")

    try:
        with httpx.Client() as client:
            # Get user from auth
            user_response = client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "apikey": settings.supabase_key,
                    "Authorization": f"Bearer {token}",
                },
            )

            if user_response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid token")

            user_id = user_response.json().get("id")

            # Get from UserData
            response = client.get(
                f"{settings.supabase_url}/rest/v1/UserData",
                params={"user_id": f"eq.{user_id}"},
                headers={"apikey": settings.supabase_key},
            )

            profiles = response.json()
            if profiles:
                return profiles[0]
            return {"user_id": user_id, "is_complete": False}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/candidates")
def get_candidates(limit: int = 10, auth_header: str = None):
    """
    Get ranked candidates - Flow:
    1. Filter by gender preference (seeking_gender)
    2. Filter by location/distance
    3. AI compatibility ranking (LAST STEP)
    """
    settings = get_settings()

    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing authorization")

    token = auth_header.replace("Bearer ", "")

    try:
        with httpx.Client() as client:
            # Get authenticated user
            user_resp = client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "apikey": settings.supabase_key,
                    "Authorization": f"Bearer {token}",
                },
            )
            user_id = user_resp.json().get("id")

            # Get my profile
            my_resp = client.get(
                f"{settings.supabase_url}/rest/v1/UserData",
                params={"user_id": f"eq.{user_id}"},
                headers={"apikey": settings.supabase_key},
            )

            if not my_resp.json():
                raise HTTPException(status_code=404, detail="Create profile first")

            my_profile = my_resp.json()[0]

            # Get all COMPLETE profiles (except self)
            all_resp = client.get(
                f"{settings.supabase_url}/rest/v1/UserData",
                params={"is_complete": "eq.true", "user_id": f"neq.{user_id}"},
                headers={"apikey": settings.supabase_key},
            )

            candidates = all_resp.json()
            if not candidates:
                return []

            # STEP 1: Filter by gender preference
            seeking = my_profile.get("seeking_gender", "everyone")
            filtered = filter_by_gender(candidates, seeking)

            # STEP 2: Filter by location
            max_dist = my_profile.get("max_distance_km", 50)
            if my_profile.get("latitude"):
                filtered = filter_by_location(
                    filtered, my_profile["latitude"], my_profile["longitude"], max_dist
                )

            # STEP 3: AI RANKING (LAST)
            ranked = rank_with_ai(my_profile, filtered)

            return ranked[:limit]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
