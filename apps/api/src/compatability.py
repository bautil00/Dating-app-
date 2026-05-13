import httpx

# LLM-based compatibility scoring using OpenRouter

def build_compatibility_prompt(profile_a: dict, profile_b: dict) -> str:
    def get_interests(profile):
        interests = [
            profile.get('interest_1', ''),
            profile.get('interest_2', ''),
            profile.get('interest_3', ''),
        ]
        return ', '.join([i for i in interests if i])

    return (
        "You are a dating app compatibility analyzer. "
        "Given two user profiles, return a compatibility score from 0 to 100 as a single number only. "
        "No explanation, no text, just the number."
        "This compatibility score should be calculated by comparing similarity of user profiles first and foremost (80 percent of the total compatibility score)."
        "The most important field for approximating user similarity is age, followed by interests, then finally job.\n"
        "The remaining 20 percent of the score should be calculated by comparing how compatible a person with each feature is with a person of another feature. "
        "Use the data available to you, as well as your own judgment, to decide on this 'trait compatibility' portion.\n\n"
        f"Person A:\n"
        f"- Interests: {get_interests(profile_a)}\n"
        f"- Age: {profile_a.get('Age', 'unknown')}\n"
        f"- Job: {profile_a.get('Job', 'unknown')}\n"
        f"- Gender: {profile_a.get('gender', 'unknown')}\n\n"
        f"Person B:\n"
        f"- Interests: {get_interests(profile_b)}\n"
        f"- Age: {profile_b.get('Age', 'unknown')}\n"
        f"- Job: {profile_b.get('Job', 'unknown')}\n"
        f"- Gender: {profile_b.get('gender', 'unknown')}\n\n"
        "Compatibility score (0-100):"
    )


def get_llm_compatibility_score(api_key: str, profile_a: dict, profile_b: dict) -> float:
    if not api_key:
        return 0.0

    prompt = build_compatibility_prompt(profile_a, profile_b)

    try:
        with httpx.Client() as client:
            resp = client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                json={
                    "model": "openrouter/free",
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are a compatibility scoring assistant. Reply with a single number only.",
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 10,
                },
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                timeout=60,
            )
            if resp.status_code >= 400:
                return 0.0
            content = (
                resp.json()
                .get("choices", [{}])[0]
                .get("message", {})
                .get("content", "0")
                .strip()
            )
            return float(content)
    except Exception:
        return 0.0