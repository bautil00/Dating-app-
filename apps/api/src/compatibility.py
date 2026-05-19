import re
from typing import Any

import httpx

# LLM-based compatibility scoring using OpenRouter

DEFAULT_COMPATIBILITY_MODELS = [
    "liquid/lfm-2.5-1.2b-instruct:free",
]
OPENROUTER_SCORING_TIMEOUT_SECONDS = 4.0


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
        f"- Job: {_profile_value(profile_a, 'job', 'Job')}\n"
        f"- Gender: {_profile_value(profile_a, 'gender', 'Gender')}\n"
        f"- Education: {_profile_value(profile_a, 'education', 'Education')}\n"
        f"- Relationship: {_profile_value(profile_a, 'relationship', 'relationship_status')}\n"
        f"- Available days: {_profile_list(profile_a, 'availability', 'day_availability') or 'unknown'}\n"
        f"- Available times: {_profile_list(profile_a, 'time_availability', 'timeAvailability') or 'unknown'}\n\n"
        f"Person B:\n"
        f"- Interests: {_profile_interests(profile_b) or 'unknown'}\n"
        f"- Age: {_profile_value(profile_b, 'age', 'Age')}\n"
        f"- Job: {_profile_value(profile_b, 'job', 'Job')}\n"
        f"- Gender: {_profile_value(profile_b, 'gender', 'Gender')}\n"
        f"- Education: {_profile_value(profile_b, 'education', 'Education')}\n"
        f"- Relationship: {_profile_value(profile_b, 'relationship', 'relationship_status')}\n"
        f"- Available days: {_profile_list(profile_b, 'availability', 'day_availability') or 'unknown'}\n"
        f"- Available times: {_profile_list(profile_b, 'time_availability', 'timeAvailability') or 'unknown'}\n\n"
        "Compatibility score (0-100):"
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
