import json
import re
from typing import Any

import httpx

# LLM-based compatibility scoring using OpenRouter

DEFAULT_COMPATIBILITY_MODELS = [
    "liquid/lfm-2.5-1.2b-instruct:free",
]
OPENROUTER_SCORING_TIMEOUT_SECONDS = 4.0
MAX_REASON_LENGTH = 180
MAX_FACTOR_DETAIL_LENGTH = 160


def _profile_value(profile: dict, *keys: str) -> Any:
    for key in keys:
        value = profile.get(key)
        if value not in (None, ""):
            return value
    return "unknown"


def _profile_interests(profile: dict) -> str:
    interests = profile.get("interests")
    values: list[str]
    if isinstance(interests, list):
        values = [str(value).strip() for value in interests]
    elif interests:
        values = [value.strip() for value in str(interests).split(",")]
    else:
        values = [
            str(profile.get(key, "")).strip()
            for key in ("interest_1", "interest_2", "interest_3", "Interest")
        ]
    return ", ".join(value for value in values if value)


def _profile_list(profile: dict, *keys: str) -> str:
    for key in keys:
        value = profile.get(key)
        if value in (None, ""):
            continue
        if isinstance(value, list):
            return ", ".join(str(item).strip() for item in value if str(item).strip())
        return ", ".join(part.strip() for part in str(value).split(",") if part.strip())
    return ""


def _profile_distance(profile: dict) -> str:
    value = profile.get("distance_km")
    if value in (None, ""):
        return "unknown"
    try:
        return f"{float(value):.1f} km"
    except (TypeError, ValueError):
        return str(value)


def build_compatibility_prompt(profile_a: dict, profile_b: dict) -> str:
    return (
        "You are a dating app compatibility analyzer. "
        "Given two user profiles, return a compatibility score from 0 to 100 as a single number only. "
        "No explanation, no text, just the number."
        "This compatibility score should be calculated by comparing similarity of user profiles first and foremost (80 percent of the total compatibility score)."
        "The most important field for approximating user similarity is age, followed by interests, then finally job.\n"
        "The remaining 20 percent of the score should be calculated by comparing how compatible a person with each feature is with a person of another feature. "
        "Use the data available to you, as well as your own judgment, to decide on this 'trait compatibility' portion.\n\n"
        f"Person A:\n"
        f"- Interests: {_profile_interests(profile_a) or 'unknown'}\n"
        f"- Age: {_profile_value(profile_a, 'age', 'Age')}\n"
        f"- Height: {_profile_value(profile_a, 'height', 'Height')}\n"
        f"- Job: {_profile_value(profile_a, 'job', 'Job')}\n"
        f"- Gender: {_profile_value(profile_a, 'gender', 'Gender')}\n"
        f"- Has kids: {_profile_value(profile_a, 'kids')}\n"
        f"- Preferred partner height: {_profile_value(profile_a, 'preferred_min_height')} to {_profile_value(profile_a, 'preferred_max_height')}\n"
        f"- Preferred partner kids status: {_profile_value(profile_a, 'preferred_kids')}\n"
        f"- Location: {_profile_value(profile_a, 'location_name', 'Location', 'location')}\n"
        f"- Education: {_profile_value(profile_a, 'education', 'Education')}\n"
        f"- Relationship: {_profile_value(profile_a, 'relationship', 'relationship_status')}\n"
        f"- Available days: {_profile_list(profile_a, 'availability', 'day_availability') or 'unknown'}\n"
        f"- Available times: {_profile_list(profile_a, 'time_availability', 'timeAvailability') or 'unknown'}\n\n"
        f"Person B:\n"
        f"- Interests: {_profile_interests(profile_b) or 'unknown'}\n"
        f"- Age: {_profile_value(profile_b, 'age', 'Age')}\n"
        f"- Height: {_profile_value(profile_b, 'height', 'Height')}\n"
        f"- Job: {_profile_value(profile_b, 'job', 'Job')}\n"
        f"- Gender: {_profile_value(profile_b, 'gender', 'Gender')}\n"
        f"- Has kids: {_profile_value(profile_b, 'kids')}\n"
        f"- Preferred partner height: {_profile_value(profile_b, 'preferred_min_height')} to {_profile_value(profile_b, 'preferred_max_height')}\n"
        f"- Preferred partner kids status: {_profile_value(profile_b, 'preferred_kids')}\n"
        f"- Location: {_profile_value(profile_b, 'location_name', 'Location', 'location')}\n"
        f"- Distance from Person A: {_profile_distance(profile_b)}\n"
        f"- Education: {_profile_value(profile_b, 'education', 'Education')}\n"
        f"- Relationship: {_profile_value(profile_b, 'relationship', 'relationship_status')}\n"
        f"- Available days: {_profile_list(profile_b, 'availability', 'day_availability') or 'unknown'}\n"
        f"- Available times: {_profile_list(profile_b, 'time_availability', 'timeAvailability') or 'unknown'}\n\n"
        "Compatibility score (0-100):"
    )


def build_compatibility_result_prompt(profile_a: dict, profile_b: dict) -> str:
    return (
        build_compatibility_prompt(profile_a, profile_b).removesuffix(
            "Compatibility score (0-100):"
        )
        + "Return exactly one JSON object with this shape: "
        '{"score": 0-100, "reason": "one short user-facing sentence", '
        '"factors": [{"label": "short label", "points": 0-100, "detail": "short detail"}]}. '
        "Include 2 to 4 factors. Do not include coordinates, sexual content, sensitive assumptions, "
        "or facts not present in the profiles. JSON only."
    )


def _post_openrouter_chat(client, api_key: str, payload: dict):
    try:
        return client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=OPENROUTER_SCORING_TIMEOUT_SECONDS,
        )
    except Exception:
        return None


def _score_from_openrouter_response(resp) -> float | None:
    if resp is None or resp.status_code >= 400:
        return None
    try:
        content = (
            resp.json()
            .get("choices", [{}])[0]
            .get("message", {})
            .get("content", "0")
            .strip()
        )
        match = re.search(r"-?\d+(?:\.\d+)?", content)
        if not match:
            return None
        score = float(match.group(0))
        return max(0.0, min(100.0, score))
    except Exception:
        return None


def _clamp_score(value: Any) -> float | None:
    try:
        score = float(value)
    except (TypeError, ValueError):
        return None
    return max(0.0, min(100.0, score))


def _sanitize_text(value: Any, max_length: int) -> str:
    text = re.sub(r"\s+", " ", str(value or "")).strip()
    if len(text) > max_length:
        text = text[: max_length - 3].rstrip() + "..."
    return text


def _extract_json_object(content: str) -> dict | None:
    content = content.strip()
    if content.startswith("```"):
        content = re.sub(r"^```(?:json)?", "", content, flags=re.IGNORECASE).strip()
        content = re.sub(r"```$", "", content).strip()
    try:
        parsed = json.loads(content)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        pass

    start = content.find("{")
    end = content.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        parsed = json.loads(content[start : end + 1])
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        return None


def _normalize_factor(value: Any) -> dict | None:
    if not isinstance(value, dict):
        return None
    label = _sanitize_text(value.get("label"), 60)
    detail = _sanitize_text(value.get("detail"), MAX_FACTOR_DETAIL_LENGTH)
    points = _clamp_score(value.get("points"))
    if not label or not detail:
        return None
    result: dict[str, Any] = {"label": label, "detail": detail}
    if points is not None:
        result["points"] = round(points)
    return result


def _compatibility_result_from_openrouter_response(
    resp, model_id: str
) -> dict[str, Any] | None:
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
        parsed = _extract_json_object(content)
        if not parsed:
            return None
        score = _clamp_score(parsed.get("score"))
        reason = _sanitize_text(parsed.get("reason"), MAX_REASON_LENGTH)
        if score is None or not reason:
            return None
        factors = [
            factor
            for factor in (
                _normalize_factor(item) for item in parsed.get("factors", [])
            )
            if factor
        ][:4]
        return {
            "score": score,
            "reason": reason,
            "factors": factors,
            "source": "openrouter",
            "model_id": model_id,
        }
    except Exception:
        return None


def get_llm_compatibility_result(
    api_key: str,
    profile_a: dict,
    profile_b: dict,
    models: list[str] | None = None,
) -> dict[str, Any] | None:
    if not api_key:
        return None

    prompt = build_compatibility_result_prompt(profile_a, profile_b)
    model_ids = models or DEFAULT_COMPATIBILITY_MODELS

    with httpx.Client() as client:
        for model_id in model_ids:
            resp = _post_openrouter_chat(
                client,
                api_key,
                {
                    "model": model_id,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a compatibility scoring assistant. "
                                "Reply with valid JSON only."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 220,
                    "temperature": 0,
                },
            )
            result = _compatibility_result_from_openrouter_response(resp, model_id)
            if result is not None:
                return result
    return None


def get_llm_compatibility_score(
    api_key: str,
    profile_a: dict,
    profile_b: dict,
    models: list[str] | None = None,
) -> float | None:
    if not api_key:
        return None

    prompt = build_compatibility_prompt(profile_a, profile_b)
    model_ids = models or DEFAULT_COMPATIBILITY_MODELS

    with httpx.Client() as client:
        for model_id in model_ids:
            resp = _post_openrouter_chat(
                client,
                api_key,
                {
                    "model": model_id,
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a compatibility scoring assistant. Reply with a single number only.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 10,
                    "temperature": 0,
                },
            )
            score = _score_from_openrouter_response(resp)
            if score is not None:
                return score
    return None
