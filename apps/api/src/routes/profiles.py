from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
import math
import httpx
from ..config import get_settings

router = APIRouter(prefix="/profiles", tags=["Profiles"])


def get_settings():
    from ..config import get_settings

    return get_settings()


def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in km"""
    R = 6371  # Earth's radius in km
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def filter_by_location(profiles, user_lat, user_lon, max_distance_km):
    """Filter profiles by distance"""
    if not user_lat or not user_lon:
        return profiles

    filtered = []
    for p in profiles:
        if p.get("latitude") and p.get("longitude"):
            dist = haversine_distance(user_lat, user_lon, p["latitude"], p["longitude"])
            if dist <= max_distance_km:
                p["distance_km"] = round(dist, 1)
                filtered.append(p)
        else:
            filtered.append(p)
    return filtered


def filter_by_gender(profiles, seeking_gender):
    """Filter profiles by gender preference"""
    if not seeking_gender or seeking_gender == "everyone":
        return profiles

    if seeking_gender == "both":
        return [p for p in profiles if p.get("gender") in ["male", "female"]]

    return [
        p for p in profiles if p.get("gender", "").lower() == seeking_gender.lower()
    ]


def rank_with_ai(user_profile, candidates):
    """Rank candidates using AI/ML service (last step)"""
    from ..services.recommendation_service import recommendation_service

    scored = []
    for candidate in candidates:
        score = recommendation_service.calculate_compatibility_score(
            user_interests=user_profile.get("interests", ""),
            user_personality=user_profile.get("personality_type", ""),
            candidate_interests=candidate.get("interests", ""),
            candidate_personality=candidate.get("personality_type", ""),
        )
        candidate["compatibility_score"] = round(score * 100, 1)  # Convert to 0-100
        scored.append(candidate)

    # Sort by compatibility score (highest first)
    scored.sort(key=lambda x: x["compatibility_score"], reverse=True)
    return scored


@router.post("/")
def create_profile(profile: dict):
    """Create or update user profile"""
    settings = get_settings()

    try:
        with httpx.Client() as client:
            # Check if profile exists
            response = client.get(
                f"{settings.supabase_url}/rest/v1/profiles",
                params={"user_id": "eq." + profile.get("user_id", "")},
                headers={"apikey": settings.supabase_key},
            )

            if response.status_code == 200 and response.json():
                # Update existing
                existing_id = response.json()[0]["id"]
                update_response = client.patch(
                    f"{settings.supabase_url}/rest/v1/profiles?id=eq.{existing_id}",
                    json=profile,
                    headers={
                        "apikey": settings.supabase_key,
                        "Content-Type": "application/json",
                    },
                )
                return update_response.json()
            else:
                # Create new
                insert_response = client.post(
                    f"{settings.supabase_url}/rest/v1/profiles",
                    json=profile,
                    headers={
                        "apikey": settings.supabase_key,
                        "Content-Type": "application/json",
                    },
                )
                return insert_response.json()

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

            user_data = user_response.json()
            user_id = user_data.get("id")

            # Get profile
            profile_response = client.get(
                f"{settings.supabase_url}/rest/v1/profiles",
                params={"user_id": f"eq.{user_id}"},
                headers={"apikey": settings.supabase_key},
            )

            profiles = profile_response.json()
            if profiles:
                return profiles[0]
            return {"user_id": user_id, "is_complete": False}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/candidates")
def get_candidates(limit: int = 10, auth_header: str = None):
    """
    Get ranked candidates - Flow:
    1. Filter by gender preference
    2. Filter by location/distance
    3. AI compatibility ranking (LAST STEP)
    """
    settings = get_settings()

    if not auth_header:
        raise HTTPException(status_code=401, detail="Missing authorization")

    token = auth_header.replace("Bearer ", "")

    try:
        with httpx.Client() as client:
            # Get current user
            user_response = client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "apikey": settings.supabase_key,
                    "Authorization": f"Bearer {token}",
                },
            )
            user_data = user_response.json()
            user_id = user_data.get("id")

            # Get user's profile for filtering
            my_profile_response = client.get(
                f"{settings.supabase_url}/rest/v1/profiles",
                params={"user_id": f"eq.{user_id}"},
                headers={"apikey": settings.supabase_key},
            )

            my_profiles = my_profile_response.json()
            if not my_profiles:
                raise HTTPException(status_code=404, detail="Create profile first")

            my_profile = my_profiles[0]

            # Get all other COMPLETE profiles
            all_response = client.get(
                f"{settings.supabase_url}/rest/v1/profiles",
                params={"is_complete": "eq.true", "user_id": f"neq.{user_id}"},
                headers={"apikey": settings.supabase_key},
            )

            candidates = all_response.json()
            if not candidates:
                return []

            # STEP 1: Filter by gender preference
            seeking = my_profile.get("seeking_gender", "everyone")
            filtered = filter_by_gender(candidates, seeking)

            # STEP 2: Filter by location
            user_lat = my_profile.get("latitude")
            user_lon = my_profile.get("longitude")
            max_dist = my_profile.get("max_distance_km", 50)
            if user_lat and user_lon:
                filtered = filter_by_location(filtered, user_lat, user_lon, max_dist)

            # STEP 3: AI RANKING (LAST STEP)
            ranked = rank_with_ai(my_profile, filtered)

            return ranked[:limit]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{profile_id}")
def get_profile(profile_id: int):
    """Get a specific profile"""
    settings = get_settings()

    try:
        with httpx.Client() as client:
            response = client.get(
                f"{settings.supabase_url}/rest/v1/profiles",
                params={"id": f"eq.{profile_id}"},
                headers={"apikey": settings.supabase_key},
            )

            profiles = response.json()
            if profiles:
                return profiles[0]
            raise HTTPException(status_code=404, detail="Profile not found")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
